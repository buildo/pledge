# pledge

A slack bot that helps your team keep commitments

# quick start

## install

- close this repo, then `npm run build`, `npm run start`
- with your browser, go to `http://my.pledge.deploy.com/add-to-slack` and authorize pledge on your slack team

## how to use

In slack, from any channel, do `/pledge @performer [what] by [when]`. You'll be the requester.

To list your pledges, both as requester and as performer, do `/pledge list`.

# about commitments

*commitments are called pledges in pledge*

Read http://www.managementexchange.com/hack/commitment-based-management-20-making-and-keeping-commitments.

here's an extract from the article linked above.

1. **Make requests, not assignments.**  This practice is not limited to hierarchical roles; The requester formulates an explicit request (i.e. in the form of a question, not a statement).  For example, “Bill, can you get the spec to me by August 1?”; not “Bill, I need the spec by August 1.”  Bill responds by making sure he understands the specific details and expectations associated with the request.  A clear request is composed with a specific due date.

2. **Negotiate clear agreements.**  This is the part about “saying what you’re going to do.”  For delivery dates that you cannot meet, make a counter-promise you can keep.  The requester changes from a position of hope (i.e. “I assigned this task to Bill with an August 1 due date, and I’m hoping he will deliver.”), to a position of confidence (i.e. “Bill said an August 1 delivery was really a problem for him, but he committed to getting it to me by August 5”). Decline the request if you know you will not or cannot deliver. This practice puts the performer more on a peer-to-peer footing with the requester, but yields clear accountability.

3. **Keep communication going during the delivery stage.**  Stuff happens along the way.  Agreements are not guarantees that the delivery date will be met, but agreements must be honored in a manner that is far different than failing to deliver on an assignment dropped on your lap without dialog.  Having made a promise to deliver, the performer is now obliged to alert their customer as soon as anything comes up that may interfere with meeting their agreement.  An observable hallmark of this practice is early notice of potential problems with meeting a commitment. 

4. **Present the deliverable explicitly.**   The performer makes a clear statement saying “Here is what I said I would deliver” or “This is why I could not deliver”.  This is the essence and evidence of accountability.  In our current work norms, this step is frequently “fudged”.  Deliveries that are nearly complete slide in more or less on the day they were hoped for.  It is rare for a performer to make a clear statement that today I am delivering on the agreement we made.

5. **When the requester, always acknowledge and assess the delivery.**  Honesty and truth demand an assessment as to whether the delivery met the original expectations.  Answering the question - were you satisfied? – completes the cycle and assures closure.  This underutilized practice is the minimum quid pro quo to the effort of the performer and serves to represent the customer’s accountability to honor the agreement.  Moreover, these are the “golden moments” when feedback can enhance both future performance and trust.

# notes for developers

## develop locally and test

There's a test slack team called `pledge-test`, ask luca to invite you.

There are 2 slack applications (associated to luca's account in team buildo):
- **pledge** is the production application, which points to `pledge.our.buildo.io`
- **pledge-test** is the test application, which points to `pledge-test.ngrok.com`

`pledge-test.ngrok.com` is a tunnel to your local server, to start it:

1. add `clientId` and `clientSecret` to config.json (from [here](https://api.slack.com/apps/A41NPK9AB/general))
1. install ngrok: `brew cask install ngrok`
1. login with `ngrok authtoken {TOKEN}` (saved in buildo's password manager)
1. start the tunnel: `ngrok http -subdomain pledge-test -region eu 3000`
1. `yarn watch` to compile on changes
1. `yarn restart` to restart node on changes (uses `nodemon`)
