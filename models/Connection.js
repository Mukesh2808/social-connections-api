// models/Connection.js
const { pool } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const User = require('./User');

class Connection {
    // Helper function to order user IDs consistently
    static orderUserIds(user1_str_id, user2_str_id) {
        return user1_str_id < user2_str_id
            ? [user1_str_id, user2_str_id]
            : [user2_str_id, user1_str_id];
    }

    // Create a new connection
    static async create(user1_str_id, user2_str_id) {
        try {
            if (user1_str_id === user2_str_id) {
                throw new AppError('Users cannot connect to themselves', 400, 'INVALID_CONNECTION');
            }
            // Check if both users exist
            const user1Exists = await User.exists(user1_str_id);
            const user2Exists = await User.exists(user2_str_id);
            if (!user1Exists) {
                throw new AppError(`User '${user1_str_id}' not found`, 404, 'USER_NOT_FOUND');
            }
            if (!user2Exists) {
                throw new AppError(`User '${user2_str_id}' not found`, 404, 'USER_NOT_FOUND');
            }
            // Order for unique pair
            const [orderedUser1, orderedUser2] = this.orderUserIds(user1_str_id, user2_str_id);

            // Check if connection already exists
            const existingConnection = await this.findConnection(user1_str_id, user2_str_id);
            if (existingConnection) {
                throw new AppError('Connection already exists between these users', 409, 'CONNECTION_EXISTS');
            }

            const query = `
                INSERT INTO connections (user1_str_id, user2_str_id)
                VALUES ($1, $2)
                RETURNING id, user1_str_id, user2_str_id, created_at;
            `;
            const result = await pool.query(query, [orderedUser1, orderedUser2]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Find a specific connection
    static async findConnection(user1_str_id, user2_str_id) {
        try {
            const [orderedUser1, orderedUser2] = this.orderUserIds(user1_str_id, user2_str_id);
            const query = `
                SELECT id, user1_str_id, user2_str_id, created_at
                FROM connections
                WHERE user1_str_id = $1 AND user2_str_id = $2
            `;
            const result = await pool.query(query, [orderedUser1, orderedUser2]);
            return result.rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    // Remove a connection
    static async remove(user1_str_id, user2_str_id) {
        try {
            // Check if both users exist
            const user1Exists = await User.exists(user1_str_id);
            const user2Exists = await User.exists(user2_str_id);
            if (!user1Exists) {
                throw new AppError(`User '${user1_str_id}' not found`, 404, 'USER_NOT_FOUND');
            }
            if (!user2Exists) {
                throw new AppError(`User '${user2_str_id}' not found`, 404, 'USER_NOT_FOUND');
            }
            const [orderedUser1, orderedUser2] = this.orderUserIds(user1_str_id, user2_str_id);
            const query = `
                DELETE FROM connections
                WHERE user1_str_id = $1 AND user2_str_id = $2
                RETURNING id, user1_str_id, user2_str_id
            `;
            const result = await pool.query(query, [orderedUser1, orderedUser2]);
            if (result.rows.length === 0) {
                throw new AppError('Connection not found between these users', 404, 'CONNECTION_NOT_FOUND');
            }
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Calculate degree of separation using BFS
    static async calculateDegree(from_user_str_id, to_user_str_id) {
        try {
            const fromUserExists = await User.exists(from_user_str_id);
            const toUserExists = await User.exists(to_user_str_id);
            if (!fromUserExists) {
                throw new AppError(`User '${from_user_str_id}' not found`, 404, 'USER_NOT_FOUND');
            }
            if (!toUserExists) {
                throw new AppError(`User '${to_user_str_id}' not found`, 404, 'USER_NOT_FOUND');
            }
            if (from_user_str_id === to_user_str_id) {
                return { degree: 0 };
            }
            // Get all connections
            const allConnectionsQuery = `
                SELECT user1_str_id, user2_str_id FROM connections
            `;
            const connectionsResult = await pool.query(allConnectionsQuery);

            // Build adjacency list (bidirectional)
            const graph = new Map();
            connectionsResult.rows.forEach(({ user1_str_id, user2_str_id }) => {
                if (!graph.has(user1_str_id)) graph.set(user1_str_id, []);
                if (!graph.has(user2_str_id)) graph.set(user2_str_id, []);
                graph.get(user1_str_id).push(user2_str_id);
                graph.get(user2_str_id).push(user1_str_id);
            });

            // BFS
            const queue = [[from_user_str_id, 0]];
            const visited = new Set([from_user_str_id]);
            while (queue.length > 0) {
                const [currentUser, degree] = queue.shift();
                if (currentUser === to_user_str_id) {
                    return { degree };
                }
                const neighbors = graph.get(currentUser) || [];
                for (const neighbor of neighbors) {
                    if (!visited.has(neighbor)) {
                        visited.add(neighbor);
                        queue.push([neighbor, degree + 1]);
                    }
                }
            }
            return { degree: -1, message: 'not_connected' };
        } catch (error) {
            throw error;
        }
    }

    // Get all connections (for debugging/admin)
    static async getAll() {
        try {
            const query = `
                SELECT c.id, c.user1_str_id, c.user2_str_id, c.created_at,
                       u1.display_name AS user1_display_name,
                       u2.display_name AS user2_display_name
                FROM connections c
                JOIN users u1 ON c.user1_str_id = u1.user_str_id
                JOIN users u2 ON c.user2_str_id = u2.user_str_id
                ORDER BY c.created_at DESC
            `;
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Connection;
