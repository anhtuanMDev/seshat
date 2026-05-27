import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import WorldPage from "../pages/WorldPage";
import CharacterPage from "../pages/CharacterPage";
import EventPage from "../pages/EventPage";
import FightPage from "../pages/FightPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <WorldPage /> },
      { path: "characters/:id", element: <CharacterPage /> },
      { path: "events/:id", element: <EventPage /> },
      { path: "fight", element: <FightPage /> },
    ],
  },
]);
