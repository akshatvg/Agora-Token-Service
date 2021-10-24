// Create Agora Client
var client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

var localTracks = {
    videoTrack: null,
    audioTrack: null
};

// Default
var localTrackState = {
    videoTrackEnabled: true,
    audioTrackEnabled: true
}

var remoteUsers = {};

var options = {
    appID: "dfaa69c6e448468dbbd3d303da8c02f4",
    channel: null,
    uid: null,
    token: null
};

// Join Form
$("#join-form").submit(async function (e) {
    e.preventDefault();
    options.appID = "dfaa69c6e448468dbbd3d303da8c02f4";
    options.channel = $("#channel").val();
    await join();
});

async function join() {
    client.on("user-published", handleUserPublished);
    client.on("token-privilege-will-expire", handleTokenWillExpire);
    client.on("user-joined", handleUserJoined);
    client.on("user-left", handleUserLeft);
    $("#leave").attr("disabled", false);
    $("#join").attr("disabled", true);
    $("#mic-btn").attr("disabled", false);
    $("#video-btn").attr("disabled", false);
    fetch(`https://akshatvg-agora-token-server.herokuapp.com/access_token?channel=${options.channel}&uid=0`)
        .then(function (response) {
            response.json().then(async function (data) {
                console.log(data.token);
                options.uid = await client.join(options.appID, options.channel, data.token, null);
                localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
                localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();
                localTracks.videoTrack.play("local-player");
                await client.publish(Object.values(localTracks));
            });
        })
        .catch(function (err) {
            console.log('Fetch Error', err);
        });
}

function handleUserJoined(user) {
    console.log("------------------------");
    console.log("User Joined");
    const id = user.uid;
    remoteUsers[id] = user;
}

function handleUserPublished(user, mediaType) {
    customFunction(user, mediaType);
}

async function customFunction(user, mediaType) {
    const id = user.uid;
    await client.subscribe(user, mediaType);
    console.log("------------------------");
    console.log("Subscribed to user: " + id);
    if (mediaType === "video") {
        const remotePlayer = $(`
        <div id="player-wrapper-${id}">
        <p class="player-name">remoteUser${id}</p>
        <div id="player-${id}" class="player"></div>
        </div>
        `)
        $("#remote-playerlist").append(remotePlayer);
        user.videoTrack.play(`player-${id}`);
    }
}

function handleUserLeft(user) {
    const id = user.id;
    delete remoteUsers[id];
    $(`#player-wrapper-${id}`).remove();
}

function handleTokenWillExpire() {
    fetch(`https://akshatvg-agora-token-server.herokuapp.com/access_token?channel=${options.channel}&uid=0`)
        .then(function (response) {
            response.json().then(async function (data) {
                console.log(data.token);
                client.renewToken(data.token);
            });
        })
        .catch(function (err) {
            console.log('Fetch Error', err);
        });
}

async function leave() {
    for (trackName in localTracks) {
        var track = localTracks[trackName];
        if (track) {
            track.stop();
            track.close();
            localTracks[trackName] = undefined;
        }
    }
    $("#remote-playerlist").html("");
    $("#leave").attr("disabled", true);
    $("#mic-btn").attr("disabled", true);
    $("#video-btn").attr("disabled", true);
    $("#join").attr("disabled", false);
    await client.leave();
}

$("#leave").click(function () {
    leave();
});

$("#mic-btn").click(function () {
    if (localTrackState.audioTrackEnabled) {
        muteAudio();
    } else {
        unmuteAudio();
    }
});

$("#video-btn").click(function () {
    if (localTrackState.videoTrackEnabled) {
        muteVideo();
    } else {
        unmuteVideo();
    }
});

// setEnabled true turns it on and false
// turns it off.
async function muteAudio() {
    if (!localTracks.audioTrack) {
        return;
    }
    await localTracks.audioTrack.setEnabled(false);
    localTrackState.audioTrackEnabled = false;
    console.log("------------------------");
    console.log("Muted Audio.");
    $("#mic-btn").text("Unmute Audio");
}

async function unmuteAudio() {
    if (!localTracks.audioTrack) {
        return;
    }
    await localTracks.audioTrack.setEnabled(true);
    localTrackState.audioTrackEnabled = true;
    console.log("------------------------");
    console.log("Unmuted Audio.");
    $("#mic-btn").text("Mute Audio");
}

async function muteVideo() {
    if (!localTracks.videoTrack) {
        return;
    }
    await localTracks.videoTrack.setEnabled(false);
    localTrackState.videoTrackEnabled = false;
    console.log("------------------------");
    console.log("Muted Video.");
    $("#video-btn").text("Unmute Video");
}

async function unmuteVideo() {
    if (!localTracks.videoTrack) {
        return;
    }
    await localTracks.videoTrack.setEnabled(true);
    localTrackState.videoTrackEnabled = true;
    console.log("------------------------");
    console.log("Unmuted Video.");
    $("#video-btn").text("Mute Video");
}