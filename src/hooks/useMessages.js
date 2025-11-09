import { useContext } from "react";
import { MessageContext } from "../context/MessageContext";

const useMessages = () => useContext(MessageContext);

export default useMessages;
