import React from 'react';
import { useParams } from 'react-router-dom';
import PixelBoardCanvas from './PixelBoardCanvas';

const PixelBoardCanvasWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) return <div>ID du PixelBoard manquant</div>;
  return <PixelBoardCanvas boardId={id} />;
};

export default PixelBoardCanvasWrapper;
