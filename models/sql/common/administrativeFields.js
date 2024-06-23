// administrativeFields.js
const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

const administrativeFields = {
    uuid: {
        type: DataTypes.STRING,
        defaultValue: uuidv4,
        allowNull: false,
        validate: {
            notNull: { msg: 'UUID is required' },
            notEmpty: { msg: 'UUID cannot be empty' }
        }
    },
    publishStatus: {
        type: DataTypes.STRING,
        defaultValue: 'unpublished',
        validate: {
            isIn: {
                args: [['unpublished', 'proposedForPublishing', 'published', 'suspended']],
                msg: 'Invalid publish status'
            }
        }
    },
    publishedBy: {
        type: DataTypes.STRING
    },
    owners: {
        type: DataTypes.JSON,
        defaultValue: [],
        validate: {
            isArray: (value) => {
                if (!Array.isArray(value)) {
                    throw new Error('Owners must be an array');
                }
            }
        }
    },
    editors: {
        type: DataTypes.JSON,
        defaultValue: [],
        validate: {
            isArray: (value) => {
                if (!Array.isArray(value)) {
                    throw new Error('Editors must be an array');
                }
            }
        }
    },
    viewers: {
        type: DataTypes.JSON,
        defaultValue: [],
        validate: {
            isArray: (value) => {
                if (!Array.isArray(value)) {
                    throw new Error('Viewers must be an array');
                }
            }
        }
    },
    ownerLink: {
        type: DataTypes.STRING
    },
    editorLink: {
        type: DataTypes.STRING
    },
    viewerLink: {
        type: DataTypes.STRING
    },
    createdBy: {
        type: DataTypes.STRING
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'active',
        validate: {
            isIn: {
                args: [['active', 'inactive']],
                msg: 'Invalid status'
            }
        }
    }
};

module.exports = administrativeFields;