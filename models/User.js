// models/User.js
const { pool } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

class User {
    // Create a new user
    static async create(userData) {
        const { user_str_id, display_name, email } = userData;
        
        try {
            const query = `
                INSERT INTO users (user_str_id, display_name, email) 
                VALUES ($1, $2, $3) 
                RETURNING internal_db_id, user_str_id, display_name, email, status, created_at
            `;
            const values = [user_str_id, display_name, email || null];
            
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Find user by string ID
    static async findByStringId(user_str_id) {
        try {
            const query = `
                SELECT internal_db_id, user_str_id, display_name, email, status, created_at, updated_at
                FROM users 
                WHERE user_str_id = $1
            `;
            const result = await pool.query(query, [user_str_id]);
            return result.rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    // Check if user exists
    static async exists(user_str_id) {
        try {
            const query = 'SELECT 1 FROM users WHERE user_str_id = $1';
            const result = await pool.query(query, [user_str_id]);
            return result.rows.length > 0;
        } catch (error) {
            throw error;
        }
    }

    // Get user's friends
    static async getFriends(user_str_id) {
        try {
            // First verify user exists
            const userExists = await this.exists(user_str_id);
            if (!userExists) {
                throw new AppError('User not found', 404, 'USER_NOT_FOUND');
            }

            const query = `
                SELECT DISTINCT u.user_str_id, u.display_name
                FROM users u
                INNER JOIN connections c ON 
                    (c.user1_str_id = $1 AND c.user2_str_id = u.user_str_id) OR
                    (c.user2_str_id = $1 AND c.user1_str_id = u.user_str_id)
                WHERE u.user_str_id != $1
                ORDER BY u.display_name
            `;
            
            const result = await pool.query(query, [user_str_id]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    // Get friends of friends (degree 2 connections)
    static async getFriendsOfFriends(user_str_id) {
        try {
            // First verify user exists
            const userExists = await this.exists(user_str_id);
            if (!userExists) {
                throw new AppError('User not found', 404, 'USER_NOT_FOUND');
            }

            const query = `
                WITH user_friends AS (
                    -- Get direct friends of the user
                    SELECT CASE 
                        WHEN c.user1_str_id = $1 THEN c.user2_str_id 
                        ELSE c.user1_str_id 
                    END as friend_id
                    FROM connections c
                    WHERE c.user1_str_id = $1 OR c.user2_str_id = $1
                ),
                friends_of_friends AS (
                    -- Get friends of each direct friend
                    SELECT DISTINCT CASE 
                        WHEN c.user1_str_id = uf.friend_id THEN c.user2_str_id 
                        ELSE c.user1_str_id 
                    END as fof_id
                    FROM connections c
                    INNER JOIN user_friends uf ON 
                        c.user1_str_id = uf.friend_id OR c.user2_str_id = uf.friend_id
                    WHERE 
                        (c.user1_str_id = uf.friend_id OR c.user2_str_id = uf.friend_id)
                        AND c.user1_str_id != $1 
                        AND c.user2_str_id != $1
                )
                SELECT u.user_str_id, u.display_name
                FROM users u
                INNER JOIN friends_of_friends fof ON u.user_str_id = fof.fof_id
                WHERE 
                    u.user_str_id NOT IN (SELECT friend_id FROM user_friends)
                    AND u.user_str_id != $1
                ORDER BY u.display_name
            `;
            
            const result = await pool.query(query, [user_str_id]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    // Get all users (for debugging/admin purposes)
    static async getAll() {
        try {
            const query = `
                SELECT user_str_id, display_name, email, status, created_at
                FROM users 
                ORDER BY created_at DESC
            `;
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = User;
