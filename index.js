const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer();
const mongoose = require('mongoose');
const axios = require('axios');
const app = express();

mongoose.connect('mongodb://admin:349603@ds211440.mlab.com:11440/ombudsbot');

const IssueModel = mongoose.model('IssueModel', {
  issueId: String,
  infrastructureIssueType: String,
  conmmunityIssueType: String,
  issueImage: String,
  issueDescription: String,
  latitude: String,
  longitude: String,
  address: String,
  city: String,
  state: String,
  zip: String,
  country: String,
  firstName: String,
  lastName: String,
  gender: String,
  profilePicture: String,
  messengerUserId: String,
  status: String
});

const charsOfID = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const randomString = (length, chars) => {
  let result = '';
  for (let i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', (req, res) => res.send('Service up!'));

app.post('/report-issue', upload.array(), (req, res) => {
  console.log(req.body);

  const issue = new IssueModel({
    issueId: randomString(8, charsOfID),
    infrastructureIssueType: req.body.INFRA_ISSUE_TYPE,
    conmmunityIssueType: req.body.COMMUNITY_ISSUE_TYPE,
    issueImage: req.body.ISSUE_IMAGE,
    issueDescription: req.body.ISSUE_DESCRIPTION,
    latitude: req.body.latitude,
    longitude: req.body.longitude,
    address: req.body.address,
    city: req.body.city,
    state: req.body.state,
    zip: req.body.zip,
    country: req.body.country,
    firstName: req.body['first name'],
    lastName: req.body['last name'],
    gender: req.body.gender,
    profilePicture: req.body['profile pic url'],
    messengerUserId: req.body['messenger user id'],
    status: 'PENDING'
  });

  issue
    .save()
    .then(savedIssue => {
      console.log(savedIssue);
      res.json({ messages: [ { text: `Thank you very much ${req.body['first name']}, your issue was sent successfully. If you want to check its status, use this number ${savedIssue.issueId}. Bye!` } ] })
  });
});

app.get('/reported-issues/:userId', (req, res) => {
  console.log(req.params.userId);
  IssueModel.find({ messengerUserId: req.params.userId }, (err, issues) => {
    console.log(err, issues);
    res.json({
      messages: [
        {
          attachment: {
            type: 'template',
            payload: {
              'template_type': 'generic',
              'image_aspect_ration': 'square',
              elements: issues.map(issue => {
                return {
                  title: `Issue status: ${issue.status}`,
                  'image_url': issue.issueImage,
                  subtitle: issue.issueDescription.substring(0, 79),
                  buttons: [
                    {
                      'set_attributes': {
                        "show_issue_details": issue.issueId
                      },
                      "block_names": [ "Show Issue Details" ],
                      type: "show_block",
                      title: "View Details"
                    }
                  ]
                }
              })
            }
          }
        }
      ]
    });
  })
});

// https://{{BACK_END_URL}}/reported-issues/{{messenger user id}}/issue/{{show_issue_details}}
app.get('/reported-issues/:userId/issue/:issueId', (req, res) => {
  console.log(req.params.userId);
  IssueModel.findOne({ messengerUserId: req.params.userId, issueId: req.params.issueId }, (err, issue) => {
    console.log(err, issue);
    res.json({
      messages: [
        {
          text: `${issue.firstName}, the issue ${issue.issueId} is ${issue.status}. This issue has the following description:`
        },
        {
          text: `${issue.issueDescription}`
        },
        {
          text: 'The picture that you uploaded was:'
        }
      ]
    });
    axios({
        method: 'POST',
        url: 'https://graph.facebook.com/v2.6/me/messages?access_token=EAAPXJA8WNfUBAIMZCHxfa7dz76vIKogCV02kTEhSWXTqUB47AUuOpj9QGWkC5lho3KQTyJmy9X0oVKJk5WsdWaIaxdXLhtd9VbgmLJyObWF7a6yaTbd6Ec88GuFZBhlZA2eLzLnldEqaJIgMCXpZBiN9ZAUu8aB5hxF3J2NZCXtQZDZD',
        data: {
          "recipient":{
            "id": req.params.userId
          },
          "message":{
            "attachment":{
              "type":"image",
              "payload":{
                "url": issue.issueImage,
                "is_reusable":true
              }
            }
          }
        },
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => console.log(response));
  })
});

app.get('/reported-issues', (req, res) => {
  IssueModel
    .find()
    .then(issues => res.json({ issues }));
});


app.listen(3000, () => console.log('Example app listening on port 3000!'));