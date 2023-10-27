import { useParams } from "react-router-dom";

export default function GameRoom() {
    const { roomId } = useParams();
    return <>{`Hello room ${roomId}`}</>;
}
