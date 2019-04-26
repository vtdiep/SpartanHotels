const mysql = require("mysql")
var Queries = require('../../queries');
/**
 * Checks that the payment is sufficient; takes rewards into account if used
 * @param {*} requestedBooking
 * @param {*} res Express response object
 * True if passes checks, else sends http response containing an error msg and returns false
 */
async function paymentCheck(requestedBooking, res) {
    if (requestedBooking.user) {
        // if user is member
        // check if member has enough rewards if they used rewards
        checkPassed = await sufficientRewardsCheck(requestedBooking, res);
        if (!checkPassed) {
            return false;
        }
        if (requestedBooking.rewards_applied > requestedBooking.total_price) {
            res.status(400).send(`Rewards applied ${requestedBooking.rewards_applied} is more than ${requestedBooking.total_price}`);
            return false;
        }
        // check that total_price = amount_paid + rewards_applied
        // TODO: reward conversion rate
        // console.log(` total ${requestedBooking.amount_paid + requestedBooking.rewards_applied}`)
        if (requestedBooking.total_price != requestedBooking.amount_paid + requestedBooking.rewards_applied) {
            res.status(400).send(`Amount due ${requestedBooking.total_price} doesnt match amount paid (including rewards) ${requestedBooking.amount_paid + requestedBooking.rewards_applied}`);
            return false;
        }
    }
    else { // is guest
        // check that total_price = amount_paid
        // TODO: reward conversion rate
        if (requestedBooking.total_price != requestedBooking.amount_paid) {
            res.status(400).send(`Amount due ${requestedBooking.total_price} doesnt match amount paid ${requestedBooking.amount_paid}`);
            return false;
        }
    }
    return true;
}

/**
 * Assumes requestedBooking is made by user
 * Checks that the user has enough reward points to apply to their requestedBooking
 * @param {*} requestedBooking 
 * @param {*} res Express response object
 * True if passes checks, else sends http response containing an error msg and returns false
 */
async function sufficientRewardsCheck(requestedBooking,res){
    // check if user has enough rewards if user used rewards
    if( requestedBooking.rewards_applied > 0){
        let rewardQuery = mysql.format(Queries.user.getAvailableRewards, [requestedBooking.user])
        console.log(`query is ${rewardQuery}`)

        try{
            queryResults = await Queries.run(rewardQuery)
        } catch(e){
            // query failed for some reason
            console.log(e)
            res.status(400).send("bad")
            return false
        }
        let availableRewards = queryResults[0].rewards
        console.log(`availableRewards is ${availableRewards}`)
        if(availableRewards < requestedBooking.rewards_applied){
            res.status(400).send("User doesn't have enough reward points")
            return false
        }
    }
    return true
}

exports.paymentCheck = paymentCheck;
