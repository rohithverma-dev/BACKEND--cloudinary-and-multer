import React, { useState } from 'react';
import './App.css';

function App() {
  const [resume, setResume] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profileData, setProfileData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (resume && profilePhoto) {
      const formData = new FormData();
      formData.append('files', resume);
      formData.append('files', profilePhoto);

      try {
        const res = await fetch('http://localhost:7000/upload/66a2280e26754ea8217e932c', {
          method: 'PUT',
          body: formData,
        });
        const jsonResponse = await res.json();
        setProfileData(jsonResponse);
        console.log('Files uploaded successfully:', jsonResponse);
      } catch (error) {
        console.error('Error uploading files:', error);
      }
    } else {
      console.error('Please select both files');
    }
  };

  return (
    <div className="App">
      <form className="myform" onSubmit={handleSubmit}>
        <div className="">
          <label htmlFor="">Resume</label>
          <input type="file" onChange={(e) => setResume(e.target.files[0])} />
        </div>
        <div className="">
          <label htmlFor="">ProfilePhoto</label>
          <input type="file" onChange={(e) => setProfilePhoto(e.target.files[0])} />
        </div>
        <button type="submit">Upload</button>
      </form>
      {profileData && <div className="response">{JSON.stringify(profileData)}</div>}
    </div>
  );
}

export default App;
