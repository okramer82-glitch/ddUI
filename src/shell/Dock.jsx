import AIChat from "./AIChat.jsx";

/* The right panel is now a beautiful Doty chat.
   If the user is in a folder, the chat pre-references that folder. */
export default function Dock({ base, id, onCollapse }) {
  return (
    <aside className="dock dock--chat" id="dock" aria-label="Doty chat">
      <AIChat
        variant="dock"
        mode="ask"
        defaultFolderId={base === "folder" ? id : null}
        onCollapse={onCollapse}
      />
    </aside>
  );
}
