import React from "react";
import { motion } from "framer-motion";
import { EllipsisVertical } from "lucide-react";
import { cn } from "../../../lib/utils";

export interface RecentProject {
  id: number;
  label: string;
  image: string;
  time: string;
}

export interface RecentProjectsProps {
  projects: RecentProject[];
  className?: string;
}

export const RecentProjects: React.FC<RecentProjectsProps> = ({
  projects,
  className,
}) => {
  return (
    <motion.div
      className={cn("mt-15 w-full relative z-10", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.0, ease: "easeOut" }}
    >
      <motion.p
        className="text-[#171717] text-2xl font-medium mb-5"
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 1.1, ease: "easeOut" }}
      >
        Recent Projects
      </motion.p>
      <div className="grid grid-cols-3 gap-4">
        {projects.map((project, index) => (
          <motion.div
            key={project.id}
            className="border border-gray-100 rounded-lg p-1 flex flex-row justify-between items-start gap-6"
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.4,
              delay: 1.2 + index * 0.08,
              ease: "easeOut",
            }}
            whileHover={{
              scale: 1.01,
              boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
              borderColor: "#d1d5db",
            }}
          >
            <div className="flex flex-row gap-2 items-center">
              <motion.img
                src={project.image}
                alt={project.label}
                className="w-11 h-11 object-cover rounded-md"
                whileHover={{ scale: 1.08 }}
                transition={{ type: "tween", duration: 0.15 }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#171717] truncate">
                  {project.label}
                </p>
                <p className="text-xs font-normal text-[#5C5C5C] truncate">
                  {project.time}
                </p>
              </div>
            </div>
            <motion.div
              className="mt-[5px] pr-1 cursor-pointer"
              whileHover={{ scale: 1.15, color: "#FA7319" }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "tween", duration: 0.15 }}
            >
              <EllipsisVertical strokeWidth={1.5} className="w-3 h-3" />
            </motion.div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
