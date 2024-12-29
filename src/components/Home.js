import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #1a1a1a;
  color: white;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
  background-color: #2a2a2a;
  padding: 30px;
  border-radius: 8px;
  min-width: 300px;
`;

const Input = styled.input`
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #3a3a3a;
  background-color: #333;
  color: white;
`;

const Button = styled.button`
  padding: 10px;
  border-radius: 4px;
  border: none;
  background-color: #5865F2;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #4752c4;
  }
`;

const Home = () => {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (roomId && username) {
      navigate(`/room/${roomId}`, { state: { username } });
    }
  };

  const createNewRoom = () => {
    const newRoomId = Math.random().toString(36).substring(7);
    setRoomId(newRoomId);
  };

  return (
    <HomeContainer>
      <Form onSubmit={handleSubmit}>
        <h2>Sesli Sohbete Katıl</h2>
        <Input
          type="text"
          placeholder="Kullanıcı Adı"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <Input
          type="text"
          placeholder="Oda ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          required
        />
        <Button type="button" onClick={createNewRoom}>
          Yeni Oda Oluştur
        </Button>
        <Button type="submit">
          Odaya Katıl
        </Button>
      </Form>
    </HomeContainer>
  );
};

export default Home;