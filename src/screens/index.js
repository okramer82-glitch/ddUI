import Pulse from "./Pulse.jsx";
import Queue from "./Queue.jsx";
import FolderView from "./folder/FolderView.jsx";
import FlowBuilder from "./FlowBuilder.jsx";
import FlowRun from "./FlowRun.jsx";
import Agents from "./Agents.jsx";
import Learning from "./Learning.jsx";
import LearningBox from "./LearningBox.jsx";
import Skills from "./Skills.jsx";
import Reports from "./Reports.jsx";
import Gaps from "./Gaps.jsx";
import Canvas from "./Canvas.jsx";
import Search from "./Search.jsx";
import Settings from "./Settings.jsx";
import Onboarding from "./Onboarding.jsx";
import PublicForm from "./PublicForm.jsx";
import DocViewer from "./DocViewer.jsx";
import MinionsHub from "./MinionsHub.jsx";
import MinionBuilderPage from "./MinionBuilderPage.jsx";
import ProjectsHub from "./ProjectsHub.jsx";
import SupervisorBuilderPage from "./SupervisorBuilderPage.jsx";
import Upskilling, { SRS } from "./Upskilling.jsx";
import TutorCanvas from "./TutorCanvas.jsx";
import VerificationSession from "./VerificationSession.jsx";
import CalendarScreen from "./Calendar.jsx";
import Messaging from "./Messaging.jsx";
import TeamLeader from "./TeamLeader.jsx";
import PM from "./PM.jsx";
import OrgChart from "./OrgChart.jsx";
import AssignTask from "./AssignTask.jsx";

export const SCREENS = {
  pulse: Pulse, queue: Queue, folder: FolderView, flow: FlowBuilder, run: FlowRun,
  agents: Agents, learning: Learning, box: LearningBox, skills: Skills, report: Reports,
  gaps: Gaps, canvas: Canvas, search: Search, settings: Settings, onboarding: Onboarding,
  form: PublicForm, doc: DocViewer, minions: MinionsHub, minion: MinionBuilderPage, projects: ProjectsHub, supervisor: SupervisorBuilderPage,
  upskilling: Upskilling, srs: SRS, tutor: TutorCanvas, verify: VerificationSession,
  calendar: CalendarScreen,
  messaging: Messaging,
  team: TeamLeader,
  pm: PM,
  org: OrgChart,
  assign: AssignTask,
};

/** Screens that take over the whole window (hide rails A/B/D + tabs). */
export const FOCUS_SCREENS = ["onboarding", "box", "form", "minion", "supervisor", "verify"];
