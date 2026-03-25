"use client";

import { useMemo } from "react";
import { 
  ReactFlow, 
  MiniMap, 
  Controls, 
  Background, 
  BackgroundVariant, 
  MarkerType,
  Position
} from "reactflow";
import "reactflow/dist/style.css";
import { DBQuestion } from "@/lib/surveyDB";
import dagre from "dagre";

// Dagre directed graph layout instance
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: any[], edges: any[], direction = "TB") => {
  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({ rankdir: direction, nodesep: 250, ranksep: 180 });

  nodes.forEach((node) => {
    // Estimating node dimensions width/height
    dagreGraph.setNode(node.id, { width: 300, height: 100 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = { ...node };

    newNode.targetPosition = isHorizontal ? Position.Left : Position.Top;
    newNode.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

    // Shift to position by center
    newNode.position = {
      x: nodeWithPosition.x - 150,
      y: nodeWithPosition.y - 50,
    };

    return newNode;
  });

  return { nodes: newNodes, edges };
};

export function SurveyFlowchart({ questions }: { questions: DBQuestion[] }) {
  const initialNodes = useMemo(() => {
    return questions.map((q) => {
      // Define colors based on type for visual richness
      let colorClass = "text-white border-white/10";
      let bgClass = "bg-[#09090b]/80 backdrop-blur-md";
      
      if (q.type === "intro" || q.type === "statement") {
        colorClass = "text-purple-300 border-purple-500/30";
        bgClass = "bg-purple-950/20 backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.1)]";
      } else if (q.condition_json) {
        // If it's a conditioned branch node, mark it gold
        colorClass = "text-amber-300 border-amber-500/30";
        bgClass = "bg-amber-950/20 backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.1)]";
      }

      return {
        id: q.question_id,
        position: { x: 0, y: 0 },
        data: {
          label: (
            <div className="flex flex-col gap-2 p-3 min-w-[280px] max-w-[300px] text-left relative overflow-hidden">
              <div className="flex items-center justify-between gap-4 border-b border-inherit pb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                  {q.type.replace("_", " ")}
                </span>
                <span className="text-[10px] opacity-40 font-mono truncate leading-none pt-0.5">
                  #{q.question_id}
                </span>
              </div>
              <p className="text-sm font-semibold leading-snug line-clamp-3">
                {q.label_en || q.question_id}
              </p>
              {!q.is_active && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                  <span className="text-xs font-bold text-red-500 tracking-widest uppercase">INACTIVE</span>
                </div>
              )}
            </div>
          ),
        },
        className: `rounded-2xl border ${bgClass} ${colorClass}`,
      };
    });
  }, [questions]);

  const initialEdges = useMemo(() => {
    const edges: any[] = [];

    questions.forEach((q, i) => {
      if (q.condition_json && typeof q.condition_json === "object") {
        // Evaluate the required conditions to draw a line from parent
        const condObj = q.condition_json as any;
        const conditionList = condObj.and || [condObj];

        conditionList.forEach((c: any) => {
          if (c.questionId) {
            const edgeVal = c.includes ? c.includes.join(", ") : "IF";
            edges.push({
              id: `e-${c.questionId}-${q.question_id}`,
              source: c.questionId,
              target: q.question_id,
              type: "smoothstep",
              label: edgeVal,
              animated: true,
              style: { stroke: "#fbbf24", strokeWidth: 2 },
              labelStyle: { fill: "#fbbf24", fontWeight: "bold", fontSize: 10 },
              labelBgStyle: { fill: "#18181b", color: "#fff", stroke: "#fbbf24" },
              markerEnd: { type: MarkerType.ArrowClosed, color: "#fbbf24" },
            });
          }
        });
        return;
      }
      
      // If no condition, connect it logically to the previous node (sequential)
      if (i > 0) {
        // Special case: don't auto connect if the previous was a branch end? 
        // Simple fallback: connect to previous question ID
        edges.push({
          id: `e-${questions[i - 1].question_id}-${q.question_id}`,
          source: questions[i - 1].question_id,
          target: q.question_id,
          type: "smoothstep",
          style: { stroke: "rgba(255,255,255,0.15)", strokeWidth: 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: "rgba(255,255,255,0.15)" },
        });
      }
    });

    return edges;
  }, [questions]);

  const { nodes, edges } = useMemo(() => {
    return getLayoutedElements(initialNodes, initialEdges, "TB");
  }, [initialNodes, initialEdges]);

  return (
    <div className="w-full h-full min-h-[600px] border border-white/5 rounded-2xl overflow-hidden bg-[#050312]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        minZoom={0.2}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        preventScrolling={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="#3f3f46" />
        <Controls 
          className="bg-black/50 border-white/10 fill-white !mb-4 !ml-4 backdrop-blur-md rounded-xl overflow-hidden" 
          showInteractive={false} 
        />
        <MiniMap 
          nodeColor={(n: any) => {
            if (n.className?.includes("amber")) return "#f59e0b";
            if (n.className?.includes("purple")) return "#a855f7";
            return "#3f3f46";
          }}
          maskColor="rgba(0,0,0,0.6)" 
          style={{ backgroundColor: "#09090b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", overflow: "hidden" }} 
        />
      </ReactFlow>
    </div>
  );
}
