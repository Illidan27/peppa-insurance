pragma solidity ^0.5.0;

contract insurance
{
    uint public price;          // count in eth
    uint public compensation;   // count in eth
    uint public validPeriod;    // count in day
    address public authorityAgency;
    address payable public company;

    struct Client
    {
        bool isPurchased;
        bool shouldCompensate;
        bool isCompensated;
        uint purchasedTime;
    }

    mapping(address => Client) public clients;


    constructor(uint _price, uint _compensation, uint _validPeriod, address _authorityAgency) public payable
    {
        price = _price;
        compensation = _compensation;
        validPeriod = _validPeriod;
        authorityAgency = _authorityAgency;
        company = msg.sender;
    }

    function refund() public payable
    {
        require (msg.sender == company, "only the company should refund");
    }

    function getProfit(uint amount) public
    {
        require (msg.sender == company, "only the company can get profit");
        require (address(this).balance >= amount * 1 ether, "Insufficient fund");
        msg.sender.transfer(amount * 1 ether);
    }

    function authenticateCompensation(address payable beneficiary) public
    {
        require (msg.sender == authorityAgency, "only the authority agency can judge whether to compensate");

        clients[beneficiary].shouldCompensate = true;
    }

    modifier canPurchase()
    {
        require(clients[msg.sender].isPurchased == false ||
                clients[msg.sender].purchasedTime + validPeriod * 1 days <= now ||
                clients[msg.sender].isCompensated == true, "You have already got a valid insurance");
        require(msg.value == price * 1 ether, "The value of transaction should match the price");
        _;
    }

    /// the price is 'price'
    function purchase() public payable canPurchase
    {
        clients[msg.sender].isPurchased = true;
        clients[msg.sender].purchasedTime = now;
        clients[msg.sender].shouldCompensate = false;
        clients[msg.sender].isCompensated = false;
    }

    function getCompensation() public
    {
        require (clients[msg.sender].shouldCompensate == true, "You can not get the compensation");
        require (clients[msg.sender].isCompensated == false, "You have already got the compensation");
        require (clients[msg.sender].purchasedTime + validPeriod * 1 days > now, "Your insurance is out of date");
        require (address(this).balance >= compensation * 1 ether, "Insufficient fund, please contact the insurance company");

        clients[msg.sender].isCompensated = true;

        msg.sender.transfer(compensation * 1 ether);

    }
}


