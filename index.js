const express = require("express");
const { WebhookClient } = require("dialogflow-fulfillment");
const { Payload } =require("dialogflow-fulfillment");
const app = express();

const MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
var randomstring = require("randomstring"); 
var user_name="";

app.post("/dialogflow", express.json(), (req, res) => {
    const agent = new WebhookClient({ 
		request: req, response: res 
		});


async function identify_user(agent)
{
  const acct_num = agent.parameters.acct_num;
  const client = new MongoClient(url,{useUnifiedTopology: true});
  await client.connect();
  const query={"mobileno": `${acct_num}`};
  const snap = await client.db("mychatbot").collection("users").findOne(query);
  if(snap==null){
	  await agent.add("Re-Enter your account number");

  }
  else
  {
  user_name=snap.name;
  await agent.add("Welcome  "+user_name+"!!  \n How can I help you");}
}
	
async function report_issue(agent)
{
 
  var issue_vals={1:"Internet Down",2:"Slow Internet",3:"Buffering problem",4:"No connectivity"};
  
  const intent_val=agent.parameters.issue_num;
  if(intent_val>4){
  agent.add("enter valid option");
  return;
  }

  var val=issue_vals[intent_val];
  
  var trouble_ticket=randomstring.generate(7);
  
  //Generating trouble ticket and storing it in Mongodb
  //Using random module
  const client = new MongoClient(url,{useUnifiedTopology: true});
  await client.connect();
    
	var u_name = user_name;    
    var issue_val=  val; 
    var status="pending";

	let ts = Date.now();
    let date_ob = new Date(ts);
    let date = date_ob.getDate();
    let month = date_ob.getMonth() + 1;
    let year = date_ob.getFullYear();

    var time_date=year + "-" + month + "-" + date;

	var myobj = { username:u_name, issue:issue_val,status:status,time_date:time_date,trouble_ticket:trouble_ticket };

    await client.db("mychatbot").collection("issues").insertOne(myobj);
 await agent.add("The issue reported is: "+ val +"\nThe ticket number is: "+trouble_ticket);
}

//trying to load rich response
function custom_payload(agent)
{
	var payLoadData=
		{
  "richContent": [
    [
      {
        "type": "list",
        "title": "Internet Down",
        "subtitle": "Press '1' for Internet is down",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "list",
        "title": "Slow Internet",
        "subtitle": "Press '2' Slow Internet",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      },
	  {
        "type": "divider"
      },
	  {
        "type": "list",
        "title": "Buffering problem",
        "subtitle": "Press '3' for Buffering problem",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "list",
        "title": "No connectivity",
        "subtitle": "Press '4' for No connectivity",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      }
    ]
  ]
}
agent.add(new Payload(agent.UNSPECIFIED,payLoadData,{sendAsMessage:true, rawPayload:true }));
}




var intentMap = new Map();
intentMap.set("serviceintent", identify_user);
intentMap.set("serviceintent-custom", custom_payload);
intentMap.set("serviceintent-custom-custom", report_issue);

agent.handleRequest(intentMap);

});//Closing tag of app.post

app.listen(267);

