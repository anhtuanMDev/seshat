import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import WorldPage from "../pages/WorldPage";
import CharacterPage from "../pages/CharacterPage";
import CharacterListPage from "../pages/CharacterListPage";
import EventPage from "../pages/EventPage";
import TimelinePage from "../pages/TimelinePage";
import FightPage from "../pages/FightPage";
import ChapterPage from "../pages/ChapterPage";
import ChapterListPage from "../pages/ChapterListPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <WorldPage /> },
      { path: "characters", element: <CharacterListPage /> },
      { path: "characters/:id", element: <CharacterPage /> },
      { path: "events", element: <TimelinePage /> },
      { path: "events/:id", element: <EventPage /> },
      { path: "fight", element: <FightPage /> },
      { path: "chapters", element: <ChapterListPage /> },
      { path: "chapters/:id", element: <ChapterPage /> },
    ],
  },
]);
