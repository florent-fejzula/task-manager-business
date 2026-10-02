// Tasks are either "fixed" (a standing list every employee always does, never
// closed) or "one-time" (moves through the statuses and ends up Closed).
//
// Tasks created before the `type` field existed have none: the ones still in
// To Do were the standing list, anything already started or closed was a
// one-off. New and edited tasks always get an explicit type.
export function taskType(task) {
  if (task.type === "fixed" || task.type === "one-time") return task.type;
  return task.status === "todo" ? "fixed" : "one-time";
}

export const isFixedTask = (task) => taskType(task) === "fixed";
