const express = require("express");
const constant = require("../util/constants");
const router = express.Router();
const omise = require("omise")({
  publicKey: "pkey_test_5sxls0jdaswylgiu6nb",
  secretKey: "skey_test_5sxiu7m4vyggyxrftch",
});

router.post("/charge", async (req, res) => {
  try {
    const { email, name, amount, token } = req.body;

    const customer = await omise.customers.create({
      email,
      description: name,
      card: token,
    });

    const charge = await omise.charges.create({
      amount: amount,
      currency: "thb",
      customer: customer.id,
    });

    res.json({
      amount: charge.amount,
      status: charge.status,
      api_result: constant.ok,
    });
  } catch (error) {
    console.log(error);
    res.json({ error, api_result: constant.nok });
  }
});

module.exports = router;
