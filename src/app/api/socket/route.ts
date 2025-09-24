import { Server as NetServer } from 'http';
import { Server as ServerIO } from 'socket.io';
import { NextRequest } from 'next/server';

const handler = async (req: NextRequest) => {
  if (req.method === 'POST') {
    // Inicializar Socket.io se não estiver rodando
    const res = new Response('Socket initialized', { status: 200 });
    return res;
  }
};

export { handler as GET, handler as POST };