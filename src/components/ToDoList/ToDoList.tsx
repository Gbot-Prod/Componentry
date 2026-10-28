import "./ToDoList.css"
import { useState, useEffect } from "react";
import { useSortable } from "@dnd-kit/react/sortable";
import { GripVertical, X } from "lucide-react";

type SortableProps = {
  id: string;
  index: number;
  onDelete: (index: number) => void;
}

function Sortable({ id, index, onDelete }: SortableProps) {
  const { ref } = useSortable({ id, index });

  return (
    <li ref={ref} className="toDoItem">
      <GripVertical size={14} className="toDoDragHandle" aria-hidden />
      <span className="toDoItemText">{id}</span>
      <button className="toDoDeleteButton" onClick={() => onDelete(index)} aria-label={`Delete ${id}`}>
        <X size={14} />
      </button>
    </li>
  );
}

function ToDoList() {
  const [tasks, setTasks] = useState<string[]>(() => {
    const saved = localStorage.getItem("tasks");
    return saved ? JSON.parse(saved) : ["eat breakfast", "eat dog"]
  });
  const [newTask, setNewTask] = useState("");

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks])

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    setNewTask(event.target.value)
  }

  function addTask() {
    if(newTask.trim() !== "") {
      setTasks(t => [...t, newTask]);
      setNewTask("")
    }
  }

  function deleteTask(index: number) {
    setTasks(prev => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="toDoList">
      <div className="toDoInputRow">
        <input
          className="toDoInput"
          type="text"
          placeholder="Enter a Task"
          value={newTask}
          onChange={handleInputChange}
          onKeyDown={(event) => event.key === "Enter" && addTask()}
        />
        <button className="toDoAddButton" onClick={addTask}>Add</button>
      </div>

      {tasks.length === 0 ? (
        <p className="toDoEmpty">Nothing to do. Nice.</p>
      ) : (
        <ul className="toDoItems">
          {tasks.map((task, index) =>
              <Sortable
                key={task}
                id={task}
                index={index}
                onDelete={deleteTask}
              />
          )}
        </ul>
      )}
    </div>
  );
}

export default ToDoList;