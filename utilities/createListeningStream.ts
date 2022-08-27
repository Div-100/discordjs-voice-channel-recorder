import { EndBehaviorType, VoiceReceiver } from "@discordjs/voice";
import type { User } from "discord.js";
import { createWriteStream } from "node:fs";
import prism from "prism-media";
import { pipeline } from "node:stream";

function getDisplayName(userId: string, user?: User) {
  return userId;
}

export function createListeningStream(
  receiver: VoiceReceiver,
  userId: string,
  client: any,
  uniqueId: string,
  user?: User
) {
  console.log(`Listening to ${getDisplayName(userId, user)}`);
  const opusStream = receiver.subscribe(userId, {
    end: {
      behavior: EndBehaviorType.AfterSilence,
      duration: 10000,
    },
  });


  const oggStream = new prism.opus.OggLogicalBitstream({
    opusHead: new prism.opus.OpusHead({
      channelCount: 2,
      sampleRate: 48000,
    }),
    pageSizeControl: {
      maxPackets: 10,
    },
  });
  Date.now();

  const filename = `./recordings/${uniqueId}-${getDisplayName(
    userId,
    user
  )}.ogg`;
  client.recordings[uniqueId].push({
    userId,
    filePath: filename,
    startTime: Date.now(),
  });

  const out = createWriteStream(filename);

  pipeline(opusStream, oggStream, out, (err) => {
    function arrayRemove(arr: any, value: any) {
      return arr.filter(function (_val: any) {
        return _val != value;
      });
    }
    for (const recording of client.recordings[uniqueId]) {
      if (recording.userId === userId) {
        recording.endTime = Date.now();
      }
    }
    client.listeningTo = arrayRemove(client.listeningTo, userId);
  });
}
