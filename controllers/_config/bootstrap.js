const express = require("express");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");

const { createJWT } = require("../../middleware/verify");

const { createAccount } = require("../../dal/accounts");

// Accepts a new account and saves it to the database
exports.createDefaultSettings = async function (req, res, next) {
  let username = "osailAdmin";
  let plainPassword = "strongAdminPassword" + uuidv4();
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(plainPassword, salt);

  const newAccount = {
    uuid: uuidv4(),
    username: username,
    email: null,
    useCase: "administrator",
    notes: "default administrator account",
    preferredLng: "en",
    roles: ["admin", "user"],
    status: "active",
    subscriptionStatus:'active',
    password: hashedPassword,
    salt,
  };

  try {
    const createdAccount = await createAccount(newAccount);
    const newToken = createJWT(createdAccount, req.fullUrl);
    res.header("auth-token", newToken.token);
    res.header("auth-token-decoded", JSON.stringify(newToken.tokenDecoded));
    res.status(201).send({
      message:
        "Bootstrap initiated. Record this password, it is the last time it will be shown",
      payload: { username: username, password: plainPassword },
    });
  } catch (error) {
//     console.log(error);
    res.status(500).json({ message: "failure", payload: error });
  }
};
