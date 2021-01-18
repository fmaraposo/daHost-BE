const express = require('express');
const router = express.Router();
/* const mongoose = require('mongoose'); */
const { format } = require('morgan');
const Quiz = require('../models/Quiz');
const SpotifyWebAPI = require('spotify-web-api-node');

//Route to create quiz

router.post('/quiz', (req, res) => {
  const myQuestions = req.body.questions;
  const userName = req.body.user;
  const playlistTitle = req.body.playlistTitle;
  const playlistDescription = req.body.playlistDescription;
  console.log('this is the request body', req.body);
  const quizCode = Math.floor(100000 + Math.random() * 900000);

  Quiz.create({
    quizCode: quizCode,
    questions: myQuestions,
    users: userName,
    title: playlistTitle,
    description: playlistDescription,
  })
    .then((response) => {
      console.log(`This is the quiz we have just added: ${response}`);
      res.json(response);
    })
    .catch((err) => {
      console.log(`Something went wrong, here is the error: ${err}`);
    });
});

//Lobby Game - Get the Quiz from its quiz code and display the users
router.get('/quiz-code/:code', (req, res) => {
  const code = req.params.code;
  Quiz.findOne({ quizCode: code })
    .then((quiz) => {
      res.json(quiz);
    })
    .catch(() => {
      res.json({ message: 'No Quiz Found' });
    });
});

//Add array of songs to the Quiz Model
router.put('/quiz/:quizCode/addsongs', (req, res) => {
  const quizCode = req.params.quizCode;
  const songs = req.body.songs;
  Quiz.findOneAndUpdate(
    { quizCode: quizCode },
    { $push: { songs: songs } },
    { isFinished: true }
  ).then(() => {
    res.json({ message: `quiz with quizCode ${quizCode} was updated` });
  });
});

//Home Page -> Filling the form to join a quiz
router.put('/quiz/:code/users', (req, res) => {
  const code = req.params.code;
  const users = req.body.users;
  Quiz.findOne({ quizCode: code }).then((response) => {
    if (!response) {
      console.log('No Quiz Found');
      res.json({ error: 'No Quiz Found' });
    } else {
      return Quiz.findOneAndUpdate(
        { quizCode: code },
        { $push: { users: users } }
      ).then(() => {
        res.json({ message: `Quiz ${code} was updated with ${users}` });
      });
    }
  });
});

router.post('/quiz/:code/playlist', (req, res) => {
  const code = req.params.code;
  const access_token = req.body.userToken;
  let playlistURI;

  let playlist = [];
  const spotifyAPI = new SpotifyWebAPI({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  });

  Quiz.findOne({ quizCode: code }).then((quiz) => {
    const songs = quiz.songs;
    console.log(quiz);
    const playlistTitle = quiz.title;
    const playlistDescription = quiz.description;
    let getTrackPromises = [];
    console.log('clientid', process.env.SPOTIFY_CLIENT_ID);
    console.log('clientid', process.env.SPOTIFY_CLIENT_SECRET);

    spotifyAPI.setAccessToken(access_token);

    songs.forEach((song) => {
      if (song === '') {
        song = 'Never Gonna Give You Up';
      }
      getTrackPromises.push(spotifyAPI.searchTracks(`track:${song}`));
    });
    Promise.all(getTrackPromises)
      .then((data) => {
        playlist = data.map((response) => {
          return {
            name: response.body.tracks.items[0].name,
            href: response.body.tracks.items[0].href,
            preview_url: response.body.tracks.items[0].preview_url,
            uri: response.body.tracks.items[0].uri,
          };
        });

        // res.json(playlist);
        return spotifyAPI.createPlaylist(playlistTitle, {
          description: playlistDescription,
          public: true,
        });
      })
      .then((data) => {
        playlistURI = data.body.uri;
        let playlistID = data.body.id;
        console.log('This is your quiz title:', playlistTitle);
        console.log('this is your playlist ', data);
        playlistURIs = playlist.map((song) => {
          return song.uri;
        });

        return spotifyAPI.addTracksToPlaylist(playlistID, playlistURIs);
      })
      .then((data) => {
        res.json(playlistURI);
      })
      .catch((err) => {
        console.log('this is the error', err);
      });
  });
});

module.exports = router;
