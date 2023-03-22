const express = require("express");
const { getToken } = require("../passport/jwtHandler");
const router = express.Router();
const axios = require('axios')
var FormData = require('form-data');
const { nok, ok } = require("../util/constants");


router.post("/login", async (req, res) => {
    try {
        const { ldap } = req.body
        let bodyFormData = new FormData();
        bodyFormData.append('ldap', ldap);

        const result_ = await axios.post('https://clsmwa-sppro-dev04.azurewebsites.net/api/api/LoginDecrypt/Decrypt', bodyFormData)
        // res.json({result : result_})
        const result = result_.data
        const resultList = result.split('=')
        const user = resultList[1] ? resultList[1].split('@')[0] : null
        if (user) {
            const token = await getToken({ ldap })
            res.json({ token, api_result: ok, user})
        } else {
            res.json({ error: 'user not found', api_result: nok})
        }
    } catch (error) {
        console.log(error);
        res.json({ error, api_result: nok })
    }
})

module.exports = router;
