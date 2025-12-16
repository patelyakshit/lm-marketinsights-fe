import { AccordionItem } from "../AccordionPanel";
import Layers from "../MapTools/Layers/Layers";
import MapKeyContent from "./MapKeyContent";
import AnalyzeContent from "./AnalyzeContent";
import LayerIcon from "../svg/LayerIcon";
import MapKeyIcons from "../svg/MapKeyIcons";
import AnalyzeIcon from "../svg/AnalyzeIcon";

export const defaultAccordionItems: AccordionItem[] = [
  {
    id: "layers",
    title: "Layers",
    icon: LayerIcon,
    content: (
      <div className="w-full">
        <Layers />
      </div>
    ),
  },
  {
    id: "map-keys",
    title: "Map Key",
    icon: MapKeyIcons,
    content: (
      <div className="w-full">
        <MapKeyContent />
      </div>
    ),
  },
  {
    id: "analyze",
    title: "Analyze",
    icon: AnalyzeIcon,
    content: (
      <div className="w-full">
        <AnalyzeContent />
      </div>
    ),
  },
];
