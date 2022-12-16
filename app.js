/**
 * Created by mstolze on 04/01/17.
 */

const express = require('express');
const path = require('path');
const session = require('express-session');
const expressHandlebars = require('express-handlebars');

const svr = express();

svr.use(session({secret: 'gh45sdfgh3asd45df'}));
svr.engine('handlebars', expressHandlebars());
svr.set('view engine', 'handlebars');


// *************************
// *** Init File Server  ***
// *************************
svr.use(express.static(path.join(__dirname, 'public')));


// ***************************
// *** Init Server Routes  ***
// ***************************

svr.route('/serverGenStatic')
  .get(function (req, res, next) {
    res.send('serverGenStatic - returning always the same string')
  });


let direct2Counter = 0;

// +++++ serverGenDynamic

svr.route('/serverGenDynamic')
  .get(function (req, res, next) {
    direct2Counter++;
    res.send(`serverGenDynamic - Dynamic response: The global page-request counter is currently at ${direct2Counter}`);
  });


// +++++ serverGenDynamicNice

svr.route('/serverGenDynamicNice')
  .get(function (req, res, next) {
    direct2Counter++;
    res.send(makeHTMLPage('serverGenDynamicNice',
      `<h1>serverGenDynamicNice </h1>
             <h2>Dynamic response: The global page-request counter is currently at ${direct2Counter}</h2>`));
  });

function makeHTMLPage(title, body) {
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>${title}</title>
    </head>
    <body>
    ${body}
    </body>
    </html>`;
}


// +++++ serverGenDynamicTemplate1

svr.route('/serverGenDynamicTemplate1')
  .get(function (req, res, next) {
    direct2Counter++;
    const context = {
      title: 'Server Generated Dynamic Page from Template ',
      count: direct2Counter
    };
    res.render('dynamicTemplate1', context);
  });


// +++++ counterTemplate

{
  let formCounter = 0;

  svr.route('/counterTemplate')
    .get(function (req, res, next) {
      const context = {
        title: 'Counting Round-Trip-App with global Counter',
        count: formCounter
      };
      res.render('counterTemplate', context);
    });


  svr.post('/up', function (req, res) {
    formCounter++;
    res.redirect('counterTemplate');
  });

  svr.post('/down', function (req, res) {
    formCounter--;
    res.redirect('counterTemplate');
  });
}

// +++++ sessionCounter

svr.route('/sessionCounter')
  .get(function (req, res, next) {
    req.session.sessionCounter = req.session.sessionCounter || 0;
    const context = {
      title: 'Counting Round-Trip-App with individual Counter (using session) ',
      count: req.session.sessionCounter
    };
    res.render('counterSessionTemplate', context);
  });


svr.post('/upSession', function (req, res) {
  req.session.sessionCounter = req.session.sessionCounter + 1 || 1;
  res.redirect('sessionCounter');
});

svr.post('/downSession', function (req, res) {
  req.session.sessionCounter = req.session.sessionCounter - 1 || -1;
  res.redirect('sessionCounter');
});


// +++++ counterRaceRoundTrip

  let counterRaceParticipantsCounter = 0;
  const teamNamesArray = ['Bulls', 'Tigers'];
  const teamCountsArray = [0, 0];

  function getTeamNr(req) {
    if (req.session.teamNr === undefined) {
      counterRaceParticipantsCounter++;
      req.session.teamNr = (counterRaceParticipantsCounter % teamNamesArray.length);
    }
    return req.session.teamNr;
  }
  function getTeamName(req) {
    return teamNamesArray[getTeamNr(req)];
  }
  function getTeamCount(req) {
    return teamCountsArray[getTeamNr(req)];
  }
  function incTeamCount(req) {
    const teamNr = getTeamNr(req);
    teamCountsArray[teamNr] = teamCountsArray[teamNr] + 1;
  }

  svr.route('/counterRaceRoundTrip')
    .get(function (req, res, next) {
      const context = {
        title: 'Counter Race RoundTrip App',
        team: getTeamName(req),
        count: getTeamCount(req)
      };
      res.render('counterRace', context);
    })
    .post(function (req, res, next) {
      incTeamCount(req);
      res.redirect('counterRaceRoundTrip');
    });
// +++++ counterSPA
{
  let ajaxCounter = 1;

  svr.route('/getCounterJson')
    .get(function (req, res, next) {
      res.json({ajaxCounter});
    });

  svr.route('/incCounterJson')
    .post(function (req, res, next) {
      ajaxCounter++;
      res.json({ajaxCounter});
    });

  svr.route('/decCounterJson')
    .post(function (req, res, next) {
      ajaxCounter--;
      res.json({ajaxCounter});
    });
}

// +++++ counterRaceSPA

  // let spaCounterRaceParticipantsCounter = 0;
  // const spaTeamNamesArray = ['Bulls', 'Tigers'];
  // const spaTeamCountsArray = [0, 0];
  //
  // function getSpaCounterRaceTeamNr(session) {
  //   if (session.spaCounterRaceTeamNr === undefined) {
  //     spaCounterRaceParticipantsCounter++;
  //     session.spaCounterRaceTeamNr = (spaCounterRaceParticipantsCounter % spaTeamNamesArray.length);
  //   }
  //   return session.spaCounterRaceTeamNr;
  // }
  //
  // function getSpaCounterRaceTeamName(session) {
  //   return spaTeamNamesArray[getSpaCounterRaceTeamNr(session)];
  // }
  //
  // function getSpaCounterTeamCount(session) {
  //   return spaTeamCountsArray[getSpaCounterRaceTeamNr(session)];
  // }
  //
  // function incSpaCounterRaceTeamCount(session) {
  //   const teamNr = getSpaCounterRaceTeamNr(session);
  //   spaTeamCountsArray[teamNr] = spaTeamCountsArray[teamNr] + 1;
  // }

  svr.route('/raceCounterApi')
    .get(function (req, res, next) {
      res.json(
        {
          team: getTeamName(req),
          count: getTeamCount(req)
        });
    });

  svr.route('/raceCounterApi/up')
    .post(function (req, res, next) {
      incTeamCount(req);
      const counterObj = {
        team: getTeamName(req),
        count: getTeamCount(req)
      };
      console.log(`up team ${counterObj.team}, new count: ${counterObj.count}`)
      res.json(counterObj);
    });

  // +++++ counterRace Console

  svr.route('/raceCounterAllApi')
  .get(function (req, res, next) {
    // TODO clean up (hack)
    res.json(
        {
          [teamNamesArray[0]]: teamCountsArray[0],
          [teamNamesArray[1]]: teamCountsArray[1]
        });
  });

  svr.route('/raceCounterAllApi/reset')
  .post(function (req, res, next) {
    teamCountsArray[0] = 0;
    teamCountsArray[1] = 0;
    res.json(
        {
          [teamNamesArray[0]]: teamCountsArray[0],
          [teamNamesArray[1]]: teamCountsArray[1]
        });
  });


// **********************
// *** Start Server   ***
// **********************


console.log("starting server");

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
svr.listen(port);

console.log(`ServerDemo started ... Point browser to http://localhost:${port}/`);
