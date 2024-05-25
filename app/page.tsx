"use client";

import {
  formatChatMessageLinks,
  LiveKitRoom,
  VideoConference,
} from "@livekit/components-react";
import {
  AudioPresets,
  ExternalE2EEKeyProvider,
  Room,
  RoomConnectOptions,
  RoomOptions,
  VideoCodec,
  VideoPresets,
} from "livekit-client";
import { useEffect, useMemo, useState } from "react";
import "@livekit/components-styles";
import "@livekit/components-styles/prefabs";

export default function Home() {
  const codec = "h264";
  const [liveKitUrl, setLiveKitUrl] = useState(
    process.env.NEXT_PUBLIC_LIVEKIT_URL,
  );
  const [e2eeKey, setE2eeKey] = useState("");
  const [token, setToken] = useState("");
  const [room,setRoom] = useState<Room>();
  const [msg, setMsg] = useState("waiting");
  useEffect(() => {
    (async () => {
      if (e2eeKey != "" || token != "") {
        return;
      }
      try {
        const resp = await fetch(
          `/api/get-voice-token`,{
            method:"POST",
            mode:"cors",
            headers:{
              "Content-Type": "application/json",
            },
            body:JSON.stringify({
              "model":"auto",
              "voice":"cove"
            })
          }
        );
        const data = await resp.json();
        if (!data.token){
          setMsg(JSON.stringify(data))
          return
        }
        if (e2eeKey != "" || token != "") {
          return;
        }
        setE2eeKey(data.e2ee_key);
        setToken(data.token);
        setLiveKitUrl(data.url);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [e2eeKey, token]);

  const keyProvider = useMemo(() => new ExternalE2EEKeyProvider(), []);
  const e2eeEnabled = true;

  const worker = useMemo(() => {
    if (typeof window !== "undefined" && e2eeKey != "") {
      return new Worker(new URL("livekit-client/e2ee-worker", import.meta.url));
    }
    return null;
  }, [e2eeKey]);

  const roomOptions = useMemo((): RoomOptions => {
    return {
      publishDefaults: {
        videoSimulcastLayers: [VideoPresets.h540, VideoPresets.h216],
        red: !e2eeEnabled,
        videoCodec: codec as VideoCodec | undefined,
        audioPreset:AudioPresets.musicStereo,
        dtx:true,
      },
      adaptiveStream: false,
      dynacast: true,
      e2ee: typeof window!="undefined"?{
        keyProvider,
        worker:new Worker(new URL('livekit-client/e2ee-worker', import.meta.url)),
      }:undefined
    };
  }, [e2eeKey]);

  const connectOptions = useMemo((): RoomConnectOptions => {
    return {
      autoSubscribe: true,
    };
  }, []);

  useEffect(() => {
    if(e2eeKey!=""&&worker){
      keyProvider.setKey(e2eeKey).then(()=>{
        roomOptions.e2ee= {
          keyProvider,
          worker
        }
        let r=new Room(roomOptions)
        r.setE2EEEnabled(true).finally(()=>{
          setRoom(r);
        })
      })
    }
  }, [worker,e2eeKey,roomOptions]);

  return (
    <main data-lk-theme="default">
      {!!room ? (
        <LiveKitRoom
          room={room}
          token={token}
          connectOptions={connectOptions}
          serverUrl={liveKitUrl}
          audio={true}
          video={false}
        >
          <VideoConference chatMessageFormatter={formatChatMessageLinks} />
        </LiveKitRoom>
      ) : (
        <h2>{msg}</h2>
      )}
    </main>
  );
}