import AIChat from "../shell/AIChat.jsx";

/* Full-page Doty chat for assigning tasks. Opened from the bottom bar. */
export default function AssignTask() {
  return (
    <div className="view view--wide assign-wrap">
      <AIChat variant="page" mode="assign" />
    </div>
  );
}
