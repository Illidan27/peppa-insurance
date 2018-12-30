// execute when the page is open
$(document).ready(function()
{
    App.init()
    $("#purchase").click(purchase)
    $("#getCompensation").click(getCompensation)
    $("#authenticate").click(authenticate)
    $("#refund").click(refund)
    $("#getProfit").click(getProfit)

    $("#loader").show()
    $("#content").hide()
    $("#company").hide()
    $("#authorityAgency").hide()
    $("#client").hide()
    $("#notice").hide()
})

App =
{
    web3Provider: null,
    contracts: {},
    account: '0x0',
    instance: null,
    chainAddress: "http://localhost:7545",
    info: {},

    // [quote start]
    // This part of code is from
    // http://www.dappuniversity.com/articles/the-ultimate-ethereum-dapp-tutorial
    init: function()
    {
        return App.initWeb3()
    },

    initWeb3: function()
    {
        if (typeof web3 !== 'undefined')
        {
          // If a web3 instance is already provided by Meta Mask.
          App.web3Provider = web3.currentProvider
          web3 = new Web3(web3.currentProvider)
        }
        else
        {
          // Specify default instance if no web3 instance provided
          App.web3Provider = new Web3.providers.HttpProvider(chainAddress)
          web3 = new Web3(App.web3Provider)
        }
        return App.initContract()
    },

    initContract: function()
    {
        $.getJSON("insurance.json", function(insurance)
        {
            // Instantiate a new truffle contract from the artifact
            App.contracts.insurance = TruffleContract(insurance)
            // Connect provider to interact with contract
            App.contracts.insurance.setProvider(App.web3Provider)

            return App.loadContractData()
        })
    },
    // [quote end]

    loadContractData: function()
    {
        // Load account data
        web3.eth.getCoinbase(function(err, account)
        {
            if (err === null)
            {
                App.account = account
                $("#accountAddress").html("Your Account:\n" + account)
            }
        })

        // Load contract data
        App.contracts.insurance.deployed().then(function(instance)
        {
            App.instance = instance
            return App.instance.price()
        }).then(function(price)
        {
            App.info["price"] = parseInt(price.toString())
            return App.instance.compensation()
        }).then(function(compensation)
        {
            App.info["compensation"] = parseInt(compensation.toString())
            return App.instance.validPeriod()
        }).
        then(function(validPeriod)
        {
            // convert day to miliseconds
            App.info["validPeriod"] = parseInt(validPeriod.toString()) * 24 * 60 * 60 * 1000
            return App.instance.authorityAgency()
        }).
        then(function(authorityAgency)
        {
            App.info["authorityAgency"] = authorityAgency
            return App.instance.company()
        }).
        then(function(company)
        {
            App.info["company"] = company
            return App.render()
        }).
        catch(function(error)
        {
            console.warn(error)
        })
    },

    render: function()
    {
        $("#loader").hide()
        $("#content").show()
        if (App.account == null)
        {
            $("#role").html("please login in with Metamask")
        }
        else if (App.account == App.info.company)
        {
            $("#company").show()
            $("#role").html("company")
            updateBalance()
        }
        else if(App.account == App.info.authorityAgency)
        {
            $("#authorityAgency").show()
            $("#role").html("authority agency")
        }
        else
        {
            $("#client").show()
            $("#role").html("client")
            updateClientInfo()
            updateBalance()
        }
    }
}

// contract relative functions
function purchase()
{
    if (!checkPurchaseValidity())
        return

    $("#purchase").unbind()

    etherAmount = App.info.price
    weiAmount = web3.toWei(etherAmount, "ether")

    App.instance.purchase({from:App.accout, value:weiAmount}).then(function(message)
    {
        successNotify()
        updateClientInfo()
    }).catch(function(error)
    {
        errorNotify(error)
    }).finally(function()
    {
        $("#purchase").click(purchase)
    })
}

function getCompensation()
{
    if (!checkCompensationQulification())
        return

    $("#getCompensation").unbind()

    App.instance.getCompensation().then(function(message)
    {
        successNotify()
        updateClientInfo()
    })
    .catch(function(error)
    {
        errorNotify(error)
    }).finally(function()
    {
        $("#getCompensation").click(getCompensation)
    })
}

function authenticate()
{
    $("#authenticate").unbind()
    App.instance.authenticateCompensation($("#shouldCompensate").val()).then(function(message)
    {
        successNotify()
    }).catch(function(error)
    {
        errorNotify(error)
    }).finally(function()
    {
        $("#authenticate").click(authenticate)
    })
}

function refund()
{
    $("#refund").unbind()

    etherAmount = parseInt($("#companyAmount").val()) || 0
    weiAmount = web3.toWei(etherAmount, "ether")

    App.instance.refund({from:App.account, value:weiAmount}).then(function(message)
    {
        successNotify()
        updateBalance()
    }).catch(function(error)
    {
        errorNotify(error)
    }).finally(function()
    {
        $("#refund").click(refund)
    })
}

function getProfit()
{
    etherAmount = parseInt($("#companyAmount").val()) || 0

    if (!checkFundSuffitiency(etherAmount))
        return

    $("#getProfit").unbind()

    App.instance.getProfit(etherAmount).then(function(message)
    {
        successNotify()
        updateBalance()
    }).catch(function(error)
    {
        errorNotify(error)
    }).finally(function()
    {
        $("#getProfit").click(getProfit)
    })
}


// helper function
function updateBalance()
{
    web3.eth.getBalance(App.instance.address, function(err, value)
    {
        balance = parseInt(value.toString())
        App.info["balance"] = parseInt(web3.fromWei(balance, "ether"))
        $("#fund").html("contract fund: " + App.info["balance"] + " ethers")
    })
}

function updateClientInfo()
{
    App.instance.clients(App.account).then(function(account)
    {
        App.info["isPurchased"] = account[0]
        App.info["shouldCompensate"] = account[1]
        App.info["isCompensated"] = account[2]
        App.info["purchasedTime"] = new Date(parseInt(account[3].toString()) * 1000)
        dueTime = new Date(App.info.purchasedTime.getTime() + App.info.validPeriod)
        App.info["dueTime"] = dueTime
        $("#price").html("Price: " + App.info.price + " ethers")
        $("#compensationAmount").html("Compensation: " + App.info.compensation + " ethers")
        if (App.info.isPurchased)
        {
            $("#validPeriod").html("")
            $("#startDate").html("Start: " +
                                App.info.purchasedTime.toLocaleString("zh-CN", { hour12:false}))
            $("#dueDate").html("Due: " +
                                App.info.dueTime.toLocaleString("zh-CN", {hour12:false}))
            $("#isCompensated").html("Is compensated: " +
                                    (App.info.isCompensated ? "Yes" : "Not yet"))
            $("#shouldCompensated").html("Should be compensated: " +
                                    (App.info.shouldCompensate ? "Yes" : "No"))
        }
        else
        {
            dueDate = new Date(Date.now() + App.info.validPeriod)
            $("#validPeriod").html("Due date if purchased now:\n" +
                                dueDate.toLocaleString("zh-CN", {hour12:false}))
            $("#startDate").html("")
            $("#dueDate").html("")
            $("#isCompensated").html("")
            $("#shouldCompensated").html("")
        }
    }).catch(function(error)
    {
        console.warn(error)
    })
}

function errorNotify(error)
{
    $("#notice").css("background-color", "#f44336");
    $("#notice").html(error)
    $("#notice").show()
}

function successNotify()
{
    $("#notice").css("background-color", "#5fba7d");
    $("#notice").html("Succeed!")
    $("#notice").show()
}

// checker function
function checkPurchaseValidity()
{
    updateClientInfo()

    if (App.info.isPurchased == false ||
        App.info.dueTime <= Date.now() ||
        App.info.isCompensated == true)
        return true
    else
    {
        errorNotify("You have already got a valid insurance")
        return false
    }
}

function checkCompensationQulification()
{
    updateClientInfo()

    if (App.info.shouldCompensate == false)
    {
        errorNotify("Lack of qulification! Please contact the authority agency")
        return false
    }
    else if (App.info.isCompensated == true)
    {
        errorNotify("You have already got the compensation")
        return false
    }
    else if (App.info.dueTime <= Date.now())
    {
        errorNotify("Your insurance is out of date")
        return false
    }
    else
        return checkFundSuffitiency(App.info.compensation)
}

function checkFundSuffitiency(amount)
{
    updateBalance()
    if (amount > App.info.balance)
    {
        errorNotify("Insuffitient fund")
        return false
    }
    else
        return true
}