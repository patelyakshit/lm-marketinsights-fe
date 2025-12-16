import type { Artifact } from "../types/artifacts";
import { PlacestoryRenderer } from "./renderers/placestory-renderer/PlacestoryRenderer";
import { PlacestorySkeleton } from "./renderers/placestory-renderer/PlacestorySkeleton";

interface ArtifactRootProps {
  artifact: Artifact;
}

export const ArtifactRoot = ({ artifact }: ArtifactRootProps) => {
  switch (artifact.type) {
    case "PLACESTORY_ARTIFACT":
      return <PlacestoryRenderer artifact={artifact} />;

    case "PLACESTORY_SKELETON_ARTIFACT":
      return <PlacestorySkeleton />;

    default:
      console.warn("🔵 Unknown artifact type:", artifact as Artifact);
      return (
        <div className="flex items-center justify-center h-full text-gray-400">
          Unknown Artifact Type
        </div>
      );
  }
};
