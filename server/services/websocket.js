const jwt = require('jsonwebtoken');

// Store connected clients
const connectedClients = new Map();

// WebSocket event types
const WS_EVENTS = {
  SECURITY_EVENT: 'security_event',
  DASHBOARD_UPDATE: 'dashboard_update',
  CLIENT_CONNECTED: 'client_connected',
  CLIENT_DISCONNECTED: 'client_disconnected',
  ERROR: 'error'
};

// Authenticate WebSocket connection
const authenticateConnection = (token) => {
  try {
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_here');
    return decoded;
  } catch (error) {
    console.error('WebSocket authentication error:', error);
    return null;
  }
};

// Handle new WebSocket connection
const handleConnection = (ws, req) => {
  const clientId = Date.now() + Math.random().toString(36).substr(2, 9);
  let user = null;

  console.log(`WebSocket client ${clientId} attempting to connect`);

  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());

      switch (data.type) {
        case 'auth':
          // Authenticate the connection
          user = authenticateConnection(data.token);
          if (user) {
            connectedClients.set(clientId, { ws, user, clientId });
            ws.send(JSON.stringify({
              type: WS_EVENTS.CLIENT_CONNECTED,
              data: { clientId, user: { id: user.id, username: user.username, role: user.role } }
            }));
            console.log(`WebSocket client ${clientId} authenticated as ${user.username}`);
          } else {
            ws.send(JSON.stringify({
              type: WS_EVENTS.ERROR,
              data: { message: 'Authentication failed' }
            }));
            ws.close();
          }
          break;

        case 'ping':
          // Respond to ping with pong
          ws.send(JSON.stringify({
            type: 'pong',
            data: { timestamp: new Date().toISOString() }
          }));
          break;

        default:
          console.log(`Unknown WebSocket message type: ${data.type}`);
      }
    } catch (error) {
      console.error('WebSocket message parsing error:', error);
      ws.send(JSON.stringify({
        type: WS_EVENTS.ERROR,
        data: { message: 'Invalid message format' }
      }));
    }
  });

  // Handle client disconnection
  ws.on('close', () => {
    connectedClients.delete(clientId);
    console.log(`WebSocket client ${clientId} disconnected`);

    // Broadcast disconnection to other clients (if needed)
    broadcastToAuthenticatedClients(WS_EVENTS.CLIENT_DISCONNECTED, {
      clientId,
      user: user ? { id: user.id, username: user.username } : null
    });
  });

  // Handle connection errors
  ws.on('error', (error) => {
    console.error(`WebSocket client ${clientId} error:`, error);
    connectedClients.delete(clientId);
  });

  // Send initial connection message
  ws.send(JSON.stringify({
    type: 'connection_established',
    data: { clientId, message: 'Connection established. Please authenticate.' }
  }));
};

// Broadcast message to all authenticated clients
const broadcastToAuthenticatedClients = (eventType, data, excludeClientId = null) => {
  const message = JSON.stringify({
    type: eventType,
    data: {
      ...data,
      timestamp: new Date().toISOString()
    }
  });

  connectedClients.forEach((client, clientId) => {
    if (clientId !== excludeClientId && client.ws.readyState === 1) { // 1 = OPEN
      try {
        client.ws.send(message);
      } catch (error) {
        console.error(`Error sending message to client ${clientId}:`, error);
        connectedClients.delete(clientId);
      }
    }
  });
};

// Broadcast message to specific user
const broadcastToUser = (userId, eventType, data) => {
  const message = JSON.stringify({
    type: eventType,
    data: {
      ...data,
      timestamp: new Date().toISOString()
    }
  });

  connectedClients.forEach((client) => {
    if (client.user && client.user.id === userId && client.ws.readyState === 1) {
      try {
        client.ws.send(message);
      } catch (error) {
        console.error(`Error sending message to user ${userId}:`, error);
      }
    }
  });
};

// Broadcast message to clients with specific role
const broadcastToRole = (role, eventType, data) => {
  const message = JSON.stringify({
    type: eventType,
    data: {
      ...data,
      timestamp: new Date().toISOString()
    }
  });

  connectedClients.forEach((client) => {
    if (client.user && client.user.role === role && client.ws.readyState === 1) {
      try {
        client.ws.send(message);
      } catch (error) {
        console.error(`Error sending message to role ${role}:`, error);
      }
    }
  });
};

// Broadcast security event to all authenticated clients
const broadcastSecurityEvent = (securityEvent) => {
  const eventData = {
    id: securityEvent.id,
    type: securityEvent.event_type,
    severity: securityEvent.severity,
    source_ip: securityEvent.source_ip,
    description: securityEvent.description,
    location: {
      country: securityEvent.location_country,
      city: securityEvent.location_city
    },
    timestamp: securityEvent.created_at
  };

  broadcastToAuthenticatedClients(WS_EVENTS.SECURITY_EVENT, eventData);
};

// Broadcast dashboard update to all authenticated clients
const broadcastDashboardUpdate = (updateData) => {
  broadcastToAuthenticatedClients(WS_EVENTS.DASHBOARD_UPDATE, updateData);
};

// Get connection statistics
const getConnectionStats = () => {
  const totalConnections = connectedClients.size;
  const authenticatedConnections = Array.from(connectedClients.values())
    .filter(client => client.user).length;

  const roleStats = {};
  connectedClients.forEach(client => {
    if (client.user) {
      const role = client.user.role;
      roleStats[role] = (roleStats[role] || 0) + 1;
    }
  });

  return {
    total_connections: totalConnections,
    authenticated_connections: authenticatedConnections,
    connections_by_role: roleStats
  };
};

// Clean up disconnected clients (called periodically)
const cleanupDisconnectedClients = () => {
  const disconnectedClients = [];

  connectedClients.forEach((client, clientId) => {
    if (client.ws.readyState !== 1) { // Not OPEN
      disconnectedClients.push(clientId);
    }
  });

  disconnectedClients.forEach(clientId => {
    connectedClients.delete(clientId);
    console.log(`Cleaned up disconnected WebSocket client ${clientId}`);
  });

  return disconnectedClients.length;
};

module.exports = {
  handleConnection,
  broadcastToAuthenticatedClients,
  broadcastToUser,
  broadcastToRole,
  broadcastSecurityEvent,
  broadcastDashboardUpdate,
  getConnectionStats,
  cleanupDisconnectedClients,
  WS_EVENTS
};
