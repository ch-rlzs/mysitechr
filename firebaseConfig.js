const firebaseConfig = {
    apiKey: "AIzaSyBz-tstbqdAVHqs5tlNPTRzsOnXWoVMlYk",
    authDomain: "chrlzs.firebaseapp.com",
    databaseURL: "https://chrlzs-default-rtdb.firebaseio.com",
    projectId: "chrlzs",
    storageBucket: "chrlzs.appspot.com",
    messagingSenderId: "719858794237",
    appId: "1:719858794237:web:0e5bc58fc86a8dc4f2c894"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();