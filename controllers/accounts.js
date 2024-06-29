
const uuidv4 = require("uuid").v4;
const ApiError = require("../error/ApiError");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const JSZip = require('jszip');
const upload = require('../services/upload');
const fs = require('fs').promises;
const { createJWT } = require("../middleware/verify");


// Import the DAL functions
const {
  createAccount,
  getAccountById,
  getAccountByUsername,
  updateAccount,
  deleteAccount,
  getAllAccounts,
} = require('../dal/accountsDal');


exports.createNewAccount = async function (req, res, next) {
  const { username, email, useCase, notes, preferredLng, password, password2 } = req.body;

  if (!username) {
    return res.status(400).json({ message: "noUsername", payload: null });
  }

  const existingAccount = await getAccountByUsername(username);
  if (existingAccount) {
    return res.status(400).json({ message: "userExists", payload: null });
  }

  if (!password || password.length < 8 || password !== password2) {
    return res.status(400).json({ message: "passwordsDontMatch", payload: null });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newAccount = {
    uuid: uuidv4(),
    username,
    email,
    useCase,
    notes,
    preferredLng: preferredLng || "en",
    roles: ["user"],
    status: "active",
    salt,
    password: hashedPassword,
    momentCreated: new Date(),
  };

  try {
    const createdAccount = await createAccount(newAccount);
    const newToken = createJWT(createdAccount, req.fullUrl);
    res.header("auth-token", newToken.token);
    res.header("auth-token-decoded", JSON.stringify(newToken.tokenDecoded));
    res.status(200).json({
      message: "success",
      payload: {
        token: newToken.token,
        tokenDecoded: newToken.tokenDecoded,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "failure", payload: null });
  }
};

exports.login = async function (req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw ApiError.badRequest("Username and password are required.");
    }

    const account = await getAccountByUsername(username);
    if (!account) {
      throw ApiError.notFound("Account not found.");
    }

    const passwordMatch = await bcrypt.compare(password, account.password);
    if (!passwordMatch) {
      throw ApiError.unauthorized("Incorrect password.");
    }

    // Update last login timestamp
    const updatedAccount = await updateAccount(account.id, {
      momentLastLogin: new Date(),
      momentFirstLogin: account.momentFirstLogin || new Date(),
    });

    const tokenInfo = { username: updatedAccount.username, roles: updatedAccount.roles };
    const newToken = createJWT(tokenInfo, "login");
    res.header("auth-token", newToken.token);
    res.header("auth-token-decoded", JSON.stringify(newToken.tokenDecoded));
    res.status(200).json({ message: "Login successful", token: newToken.token });
  } catch (error) {
    next(error);
  }

};


exports.getAccounts = async function (req, res, next) {
  try {
    const accountInfo = await getAllAccounts();
    
      res.status(200).json({ message: "Here is the account info", payload: accountInfo });
   } catch (error) {
    next(error);
  }
};


exports.accountOwn = async function (req, res, next) {
  try {
    const username = req.tokenDecoded.username;
    const accountInfo = await getAccountByUsername(username);
    
    if (accountInfo && accountInfo.status === "active") {
      const { password, salt, ...safeAccountInfo } = accountInfo;
      res.status(200).json({ message: "Here is the account info", payload: safeAccountInfo });
    } else {
      res.status(404).json({ message: "No active account found", payload: null });
    }
  } catch (error) {
    next(error);
  }
};

exports.accountOwnUpdate = async function (req, res, next) {
  try {
    const username = req.tokenDecoded.username;
    let accountData = req.body.account || {};
    
    if (accountData.username !== username) {
      return res.status(403).json({ message: "Usernames do not match.", payload: null });
    }

    const account = await getAccountByUsername(username);
    if (!account || account.status !== "active") {
      return res.status(404).json({ message: "No active account found", payload: null });
    }

    const updatedAccount = await updateAccount(account.id, accountData);

    if (updatedAccount) {
      res.status(200).json({ message: "Account updated", payload: updatedAccount });
    } else {
      res.status(500).json({ message: "Error updating account", payload: null });
    }
  } catch (error) {
    next(error);
  }
};

exports.accountOwnDelete = async function (req, res, next) {
  try {
    const username = req.tokenDecoded.username;
    const account = await getAccountByUsername(username);
    
    if (account && account.status === "active") {
      const deleteResult = await deleteAccount(account.id);
      if (deleteResult) {
        res.status(200).json({ message: "Account deleted" });
      } else {
        res.status(500).json({ message: "Error deleting account", payload: null });
      }
    } else {
      res.status(404).json({ message: "No active account found", payload: null });
    }
  } catch (error) {
    next(error);
  }
};

// ... (keep other functions like accountOwnDataDownload, accountOwnDataUpload, accountOwnDataDelete as they are)

exports.allAccountInfo = async function (req, res, next) {
  try {
    const accounts = await getAllAccounts();
    const safeAccounts = accounts.map(({ password, salt, ...safeAccount }) => safeAccount);

    if (safeAccounts.length > 0) {
      res.status(200).json({ message: "Here are all accounts info", payload: safeAccounts });
    } else {
      res.status(404).json({ message: "No active accounts found" });
    }
  } catch (error) {
    next(error);
  }
};

exports.deleteAccounts = async function (req, res, next) {
  try {
    let usernames = req.body.usernames || [];
    if (!Array.isArray(usernames)) usernames = [usernames];
    let errors = 0;
    let deleted = 0;

    for (const username of usernames) {
      const account = await getAccountByUsername(username);
      if (account && account.status === "active") {
        const deleteResult = await deleteAccount(account.id);
        if (deleteResult) {
          deleted++;
        } else {
          errors++;
        }
      } else {
        errors++;
      }
    }

    if (deleted > 0) {
      res.status(200).json({ message: "Accounts deleted", payload: { deleted, errors } });
    } else {
      res.status(404).json({ message: "No active accounts found", payload: null });
    }
  } catch (error) {
    next(error);
  }
};