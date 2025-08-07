// middleware/validation.js
const Joi = require('joi');

// Validation schemas
const schemas = {
    createUser: Joi.object({
        user_str_id: Joi.string()
            .alphanum()
            .min(3)
            .max(50)
            .required()
            .messages({
                'string.alphanum': 'user_str_id must contain only alphanumeric characters',
                'string.min': 'user_str_id must be at least 3 characters long',
                'string.max': 'user_str_id must not exceed 50 characters',
                'any.required': 'user_str_id is required'
            }),
        display_name: Joi.string()
            .min(1)
            .max(100)
            .required()
            .messages({
                'string.min': 'display_name cannot be empty',
                'string.max': 'display_name must not exceed 100 characters',
                'any.required': 'display_name is required'
            }),
        email: Joi.string()
            .email()
            .optional()
            .messages({
                'string.email': 'Please provide a valid email address'
            })
    }),

    createConnection: Joi.object({
        user1_str_id: Joi.string()
            .alphanum()
            .min(3)
            .max(50)
            .required()
            .messages({
                'string.alphanum': 'user1_str_id must contain only alphanumeric characters',
                'any.required': 'user1_str_id is required'
            }),
        user2_str_id: Joi.string()
            .alphanum()
            .min(3)
            .max(50)
            .required()
            .messages({
                'string.alphanum': 'user2_str_id must contain only alphanumeric characters',
                'any.required': 'user2_str_id is required'
            })
    }).custom((value, helpers) => {
        if (value.user1_str_id === value.user2_str_id) {
            return helpers.message('Users cannot connect to themselves');
        }
        return value;
    }),

    userParam: Joi.object({
        user_str_id: Joi.string()
            .alphanum()
            .min(3)
            .max(50)
            .required()
    }),

    degreeQuery: Joi.object({
        from_user_str_id: Joi.string()
            .alphanum()
            .min(3)
            .max(50)
            .required()
            .messages({
                'any.required': 'from_user_str_id query parameter is required'
            }),
        to_user_str_id: Joi.string()
            .alphanum()
            .min(3)
            .max(50)
            .required()
            .messages({
                'any.required': 'to_user_str_id query parameter is required'
            })
    })
};

// Validation middleware factory
const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        let data;
        
        switch (source) {
            case 'body':
                data = req.body;
                break;
            case 'params':
                data = req.params;
                break;
            case 'query':
                data = req.query;
                break;
            default:
                data = req.body;
        }

        const { error, value } = schema.validate(data, {
            abortEarly: false, // Include all errors
            stripUnknown: true, // Remove unknown properties
            convert: true // Convert strings to appropriate types
        });

        if (error) {
            const errorMessages = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                value: detail.context.value
            }));

            return res.status(400).json({
                error: 'Validation failed',
                details: errorMessages,
                timestamp: new Date().toISOString()
            });
        }

        // Replace the original data with validated/sanitized data
        switch (source) {
            case 'body':
                req.body = value;
                break;
            case 'params':
                req.params = value;
                break;
            case 'query':
                req.query = value;
                break;
        }

        next();
    };
};

module.exports = {
    validateCreateUser: validate(schemas.createUser, 'body'),
    validateCreateConnection: validate(schemas.createConnection, 'body'),
    validateUserParam: validate(schemas.userParam, 'params'),
    validateDegreeQuery: validate(schemas.degreeQuery, 'query')
};
