import { useContext } from "react";
import { PostContext } from "../context/PostContext";

const usePosts = () => useContext(PostContext);

export default usePosts;
