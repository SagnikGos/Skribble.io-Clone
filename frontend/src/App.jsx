import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

function App() {
  const canvasRef = useRef(null);
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [drawing, setDrawing] = useState(false);

  const joinRoom = () => {
    socket.emit("join-room", { roomId, username });
  };

  const createRoom = () => {
    socket.emit("create-room", { username });
    socket.on("room-created", (data) => setRoomId(data.roomId));
  };

  const draw = (x0, y0, x1, y1) => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.closePath();
  };

  useEffect(() => {
    socket.on("drawing", ({ x0, y0, x1, y1 }) => {
      draw(x0, y0, x1, y1);
    });
  }, []);

  const handleMouseDown = () => setDrawing(true);
  const handleMouseUp = () => setDrawing(false);
  const handleMouseMove = (e) => {
    if (!drawing) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const prevX = x - 1;
    const prevY = y - 1;
    socket.emit("drawing", { roomId, data: { x0: prevX, y0: prevY, x1: x, y1: y } });
    draw(prevX, prevY, x, y);
  };

  return (
    <div className="p-4">
      <input placeholder="Username" onChange={(e) => setUsername(e.target.value)} className="border p-2" />
      <input placeholder="Room ID" value={roomId} onChange={(e) => setRoomId(e.target.value)} className="border p-2 ml-2" />
      <button onClick={joinRoom} className="bg-blue-500 text-white p-2 ml-2">Join</button>
      <button onClick={createRoom} className="bg-green-500 text-white p-2 ml-2">Create</button>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border mt-4"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      />
    </div>
  );
}

export default App;
