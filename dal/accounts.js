const mongoose = require('mongoose');

const SequelizeAccount = require('../models/sql/Account');
const MongooseAccount = require('../models/mongo/documents/Account');
console.log('Imported SequelizeAccount:', SequelizeAccount);
console.log('Imported MongooseAccount:', MongooseAccount);
const { sequelize } = require('../config/sql');
const { Op } = require('sequelize');

const useSequelize = process.env.USE_SEQUELIZE === 'true';
const getModel = () => {
    console.log('useSequelize:', useSequelize);
    if (useSequelize) {
        if (!SequelizeAccount) {
            throw new Error('SequelizeAccount model is not defined');
        }
        return SequelizeAccount;
    } else {
        if (!MongooseAccount) {
            throw new Error('MongooseAccount model is not defined');
        }
        return MongooseAccount;
    }
};
async function createAccount(accountData) {
    try {
        console.log('Creating account with data:', accountData);
        const Model = getModel();
        console.log('Model:', Model);
        if (useSequelize) {
            console.log('Using Sequelize', accountData);
            const newAccount = await Model.create({ data: accountData });
            return newAccount.get({ plain: true }).data;
        } else {
            console.log('Using MongoDB');
            return await Model.create(accountData);
        }
    } catch (error) {
        console.error('Error creating account:', error);
        throw error;
    }
}

// Read
async function getAccountById(id) {
    const Model = getModel();
    if (useSequelize) {
        const account = await Model.findByPk(id);
        return account ? account.get({ plain: true }).data : null;
    } else {
        return await Model.findById(id).lean();
    }
}

async function getAccountByUsername(username) {
    const Model = getModel();
    if (useSequelize) {
        const account = await Model.findOne({
            where: sequelize.where(
                sequelize.fn('JSON_VALUE', sequelize.col('data'), '$.username'),
                username
            )
        });
        return account ? account.get({ plain: true }).data : null;
    } else {
        return await Model.findOne({ username }).lean();
    }
}

// Update
async function updateAccount(id, updateData) {
    const Model = getModel();
    if (useSequelize) {
        const account = await Model.findByPk(id);
        if (!account) return null;
        const currentData = account.get({ plain: true }).data;
        const updatedData = { ...currentData, ...updateData };
        await account.update({ data: updatedData });
        return account.get({ plain: true }).data;
    } else {
        return await Model.findByIdAndUpdate(id, updateData, { new: true }).lean();
    }
}

// Delete
async function deleteAccount(id) {
    const Model = getModel();
    if (useSequelize) {
        const account = await Model.findByPk(id);
        if (!account) return false;
        await account.destroy();
        return true;
    } else {
        const result = await Model.findByIdAndDelete(id);
        return !!result;
    }
}

module.exports = {
    createAccount,
    getAccountById,
    getAccountByUsername,
    updateAccount,
    deleteAccount
};