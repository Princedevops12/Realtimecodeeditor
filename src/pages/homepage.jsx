import React from 'react'
import {v4 as uuidv4} from 'uuid'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
const Homepage = () => {
  const [roomid, setRoomid] = React.useState("");
  const [username, setUsername] = React.useState("");
  const navigate = useNavigate();
  const createNewRoom = (e) => {
    e.preventDefault();
    const id = uuidv4();
    setRoomid(id);
    console.log(id);
    toast.success("New room created with ID: " + id);
  }
  const joinroom = () => {
    if(!roomid || !username){
      toast.error("ROOM ID & username is required");
      return;
    }
    const userId = uuidv4();
    sessionStorage.setItem('codeeditor_user_id', userId);
    sessionStorage.setItem('codeeditor_username', username);

    //redirect
    navigate(`/editor/${roomid}`, {
      state: {
        username: username,
        userId,
      },
    });
  };
      const handleinputenter = (e) => {
        console.log(e.code);
        if(e.code === "Enter"){
          joinroom();
        }}
  return (
    <div className="homepagewrapper">
      <div className="formwrapper">
        <img className = 'homelogo'src="/code editor.png" alt="code editor" ></img>
        <h3 className="mainlabel">Paste invitation ROOM ID </h3>
        <div className="inputgroup">
          <input type="text" placeholder="ROOM ID" className="inputbox" value={roomid} 
          onKeyUp ={handleinputenter}
            onChange={(e) => setRoomid(e.target.value)} />
           <input type="text" placeholder="USERNAME" 
           className="inputbox" value={username} 
            onKeyUp ={handleinputenter} onChange={(e) => setUsername(e.target.value)} />
          <button className="btn joinbtn" onClick={joinroom}>Join</button>
          <span className="createinfo">If you don't have an invite then create &nbsp;
            <a onClick={createNewRoom} href="#" className="createbtn">new room</a>
</span>



   </div>
        </div>

  
    
    <footer>
    <h3>Built with MERN by<a href="https://github.com/Princedevops12" target="_blank" rel="noopener noreferrer"> Prince</a></h3>
    </footer>
    </div>
  )

}

export default Homepage
