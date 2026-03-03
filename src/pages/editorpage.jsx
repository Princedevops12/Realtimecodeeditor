import React, { useCallback, useEffect, useRef } from 'react'
import Client from '../components/client';
import Editor from '../components/Editor';
import { initSocket } from '../socket';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import ACTIONS from './Actions';

const DEFAULT_CODE = '// Start coding here...';

const Editorpage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { roomid } = useParams();
  const username = location.state?.username || sessionStorage.getItem('codeeditor_username');
  const userId = location.state?.userId || sessionStorage.getItem('codeeditor_user_id');
  const roomId = roomid;

  const socketRef = useRef(null);
  const codeRef = useRef(DEFAULT_CODE);
  const [clients, setClients] = React.useState([]);
  const [incomingCode, setIncomingCode] = React.useState(DEFAULT_CODE);

  useEffect(() => {
    if (!username || !userId) {
      toast.error('Unique user ID is required to join editor.');
      navigate('/', { replace: true });
      return;
    }

    sessionStorage.setItem('codeeditor_user_id', userId);
    sessionStorage.setItem('codeeditor_username', username);

    const init = () => {
      socketRef.current = initSocket();
      const socket = socketRef.current;

      const handleConnectError = () => {
        toast.error('Socket connection failed. Please try again.');
      };

      const handleJoined = ({ clients: nextClients, username: joinedUsername, socketId }) => {
        setClients(nextClients || []);

        if (joinedUsername !== username) {
          toast.success(`${joinedUsername} joined the room.`);
        }

        // Only existing users should push current code to the newly joined socket.
        if (socketId !== socket.id) {
          socket.emit(ACTIONS.SYNC_CODE, {
            socketId,
            code: codeRef.current,
          });
        }
      };

      const handleDisconnected = ({ socketId, username: leftUsername }) => {
        toast.success(`${leftUsername} left the room.`);
        setClients((prev) => prev.filter((client) => client.socketId !== socketId));
      };

      const handleRemoteCodeChange = ({ code }) => {
        if (typeof code !== 'string') return;
        codeRef.current = code;
        setIncomingCode((prev) => (prev === code ? prev : code));
      };
      const handleJoinRejected = ({ reason }) => {
        toast.error(reason || 'You cannot join this room.');
        navigate('/', { replace: true });
      };

      socket.on('connect_error', handleConnectError);
      socket.on('connect_failed', handleConnectError);
      socket.on(ACTIONS.JOINED, handleJoined);
      socket.on(ACTIONS.JOIN_REJECTED, handleJoinRejected);
      socket.on(ACTIONS.DISCONNECTED, handleDisconnected);
      socket.on(ACTIONS.CODE_CHANGE, handleRemoteCodeChange);

      socket.emit(ACTIONS.JOIN, {
        roomId,
        username,
        userId,
      });
    };

    init();
    return () => {
      socketRef.current?.disconnect();
      socketRef.current?.off(ACTIONS.JOINED);
      socketRef.current?.off(ACTIONS.JOIN_REJECTED);
      socketRef.current?.off(ACTIONS.DISCONNECTED);
      socketRef.current?.off(ACTIONS.CODE_CHANGE);
    };
  }, [navigate, roomId, userId, username]);

  const handleCodeChange = useCallback((code) => {
    codeRef.current = code;
    socketRef.current?.emit(ACTIONS.CODE_CHANGE, {
      roomId,
      code,
    });
  }, [roomId]);


  const copyroomid = () => {
    navigator.clipboard.writeText(roomId);
    toast.success('Room ID copied to clipboard.');
  };

  const leaveRoom = () => {
    socketRef.current?.emit(ACTIONS.LEAVE, { roomId, username });
    navigate('/', { replace: true });
  };

  return (
    <div className="mainwrap">
      <div className="aside">
        <div className="asideinner">
          <div className="logo">
            <img className="logoimage" src="/code editor.png" alt="code editor" />
          </div>
          <h3>Connected</h3>
          <div className="clientlist">
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>
        </div>
        <div className="asidefooter">
          <button className="btn copybtn" onClick={copyroomid}>COPY ROOM ID</button>
          <button className="btn leavebtn" onClick={leaveRoom}>LEAVE</button>
        </div>
      </div>
      <div className="editorwrap">
        <Editor onCodeChange={handleCodeChange} incomingCode={incomingCode} />
      </div>
    </div>
  )

}
export default Editorpage
