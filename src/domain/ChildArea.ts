import Area from "./Area";

interface ChildArea extends Area {
  parentArea: String;
  externalParentAreaId: number;
}

export default ChildArea;
