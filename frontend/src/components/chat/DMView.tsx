import { DMPanel } from "./DMPanel";
import DMContent from "./DMContent";

export default function DMView() {
  return (
    <div className="flex h-full bg-background">
      {/* DM Panel - Left */}
      <div className="flex-shrink-0">
        <DMPanel />
      </div>

      {/* Main Content - Right */}
      <div className="flex-1 flex flex-col">
        <DMContent />
      </div>
    </div>
  );
}