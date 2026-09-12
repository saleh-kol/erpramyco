"use client";

import { useState } from "react";

import { createManualActivityAction } from "@/actions/activity";

import {
  Play,
  UserCircle2,
  X,
  Save,
  CheckCircle,
  Clock,
} from "lucide-react";

const toPersianTime = (timeStr: Date | string) => {
  if (!timeStr) return "-";

  const d = new Date(timeStr);

  if (isNaN(d.getTime())) return "-";

  return d.toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function ActivityClient({
  user,
  activeActivity,
  types,
  locations,
  projects,
  tasks,
  missions,
}: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [category, setCategory] = useState("job");

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setFormError(null);

    const formData = new FormData(e.currentTarget);

    formData.append("category", category);

    try {
      const result = await createManualActivityAction(formData);

      if (result?.error) {
        setFormError(result.error);
        return;
      }

      if (result?.success) {
        setIsModalOpen(false);
        setToast("فعالیت با موفقیت ثبت شد");

        setTimeout(() => {
          setToast(null);
        }, 3000);
      }
    } catch (error) {
      console.error(error);
      setFormError("خطایی هنگام ثبت فعالیت رخ داد.");
    }
  };

  const todayStr = new Date().toLocaleDateString("fa-IR");

  return (
    <div className="min-h-[calc(100vh-128px)] bg-slate-50 p-4 sm:p-6">

      {/* Main Card */}
      <div className="mx-auto flex min-h-[calc(100vh-176px)] max-w-[1100px] items-center justify-center">

        <div className="w-full max-w-[480px] rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          {/* User */}
          <div className="text-center">

            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-orange-50 bg-slate-100">
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user.name || "پروفایل"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserCircle2 className="h-12 w-12 text-slate-300" />
              )}
            </div>

            <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
              {user?.name}
            </h1>

            <p className="mt-1.5 text-xs text-slate-500">
              ثبت فعالیت روزانه ({todayStr})
            </p>
          </div>

          {/* Active Activity */}
          {activeActivity && (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="mb-2 text-right text-xs font-bold text-emerald-700">
                فعالیت ثبت شده امروز
              </p>

              <div className="flex items-center gap-2 text-right text-sm text-slate-700">
                <Clock className="h-4 w-4 shrink-0 text-emerald-600" />

                <span>
                  ورود:{" "}
                  {toPersianTime(activeActivity.Check_In)}
                  {" - "}
                  خروج:{" "}
                  {activeActivity.Check_Out
                    ? toPersianTime(activeActivity.Check_Out)
                    : "ثبت نشده"}
                </span>
              </div>
            </div>
          )}

          {/* Open Modal */}
          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setIsModalOpen(true);
            }}
            className="
              mt-6 flex w-full items-center
              justify-center gap-2
              rounded-xl
              bg-[#ed6e2b]
              px-5 py-3.5
              text-sm font-bold text-white
              shadow-sm shadow-orange-200
              transition-all
              hover:bg-[#d95f20]
              hover:shadow-md
              active:scale-[0.99]
            "
          >
            <Play className="h-5 w-5" />
            ثبت فعالیت جدید
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="
            fixed inset-0 z-50
            flex items-center justify-center
            bg-slate-900/60
            p-4
            backdrop-blur-sm
          "
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="
              flex max-h-[90vh] w-full max-w-[560px]
              flex-col overflow-hidden
              rounded-2xl
              border-t-4 border-[#ed6e2b]
              bg-white
              shadow-2xl
            "
            onClick={(e) => e.stopPropagation()}
          >

            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-5 py-4 sm:px-6">

              <div>
                <span className="text-[10px] font-semibold text-slate-400">
                  ثبت فعالیت
                </span>

                <h2 className="mt-0.5 text-base font-extrabold text-slate-900">
                  ثبت فعالیت برای امروز
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="بستن"
                className="
                  flex h-9 w-9 items-center justify-center
                  rounded-lg
                  text-slate-400
                  transition-all
                  hover:bg-slate-100
                  hover:text-slate-700
                "
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={handleSubmit}
              className="overflow-y-auto p-5 sm:p-6"
            >

              <div className="space-y-5">

                {/* Date & Times */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                  <div>
                    <label className="mb-2 block text-xs font-bold text-slate-600">
                      تاریخ
                    </label>

                    <input
                      type="text"
                      value={todayStr}
                      disabled
                      className="
                        w-full rounded-xl
                        border border-slate-200
                        bg-slate-100
                        px-3 py-2.5
                        text-center text-sm
                        text-slate-500
                        outline-none
                      "
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold text-slate-600">
                      ساعت ورود *
                    </label>

                    <input
                      name="checkIn"
                      type="text"
                      required
                      pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
                      title="ساعت را به صورت ۲۴ ساعته وارد کنید. مثال: 14:30 یا 08:15"
                      placeholder="14:30"
                      dir="ltr"
                      className="
                        w-full rounded-xl
                        border border-slate-200
                        bg-slate-50
                        px-3 py-2.5
                        text-center text-sm
                        text-slate-700
                        outline-none
                        transition-all
                        placeholder:text-slate-400
                        focus:border-[#ed6e2b]
                        focus:bg-white
                        focus:ring-4
                        focus:ring-orange-100
                      "
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold text-slate-600">
                      ساعت خروج *
                    </label>

                    <input
                      name="checkOut"
                      type="text"
                      required
                      pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
                      title="ساعت را به صورت ۲۴ ساعته وارد کنید. مثال: 18:45 یا 09:05"
                      placeholder="18:45"
                      dir="ltr"
                      className="
                        w-full rounded-xl
                        border border-slate-200
                        bg-slate-50
                        px-3 py-2.5
                        text-center text-sm
                        text-slate-700
                        outline-none
                        transition-all
                        placeholder:text-slate-400
                        focus:border-[#ed6e2b]
                        focus:bg-white
                        focus:ring-4
                        focus:ring-orange-100
                      "
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-600">
                    شرح انجام فعالیت *
                  </label>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">

                    {/* Job */}
                    <label
                      className={`
                        cursor-pointer rounded-xl border p-3
                        transition-all
                        ${
                          category === "job"
                            ? "border-orange-300 bg-orange-50 ring-2 ring-orange-100"
                            : "border-slate-200 bg-white hover:border-orange-200 hover:bg-orange-50/40"
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name="categoryRadio"
                        value="job"
                        checked={category === "job"}
                        onChange={() => setCategory("job")}
                        className="sr-only"
                      />

                      <div className="flex items-center gap-2">
                        <span
                          className={`
                            h-4 w-4 rounded-full border-2
                            ${
                              category === "job"
                                ? "border-[#ed6e2b] bg-[#ed6e2b] ring-2 ring-orange-100"
                                : "border-slate-300"
                            }
                          `}
                        />

                        <span className="text-xs font-bold text-slate-700">
                          شرح وظیفه
                        </span>
                      </div>
                    </label>

                    {/* Task */}
                    <div>
                      <label
                        className={`
                          block rounded-xl border p-3
                          transition-all
                          ${
                            tasks.length === 0
                              ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-50"
                              : category === "task"
                                ? "cursor-pointer border-orange-300 bg-orange-50 ring-2 ring-orange-100"
                                : "cursor-pointer border-slate-200 bg-white hover:border-orange-200 hover:bg-orange-50/40"
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name="categoryRadio"
                          value="task"
                          disabled={tasks.length === 0}
                          checked={category === "task"}
                          onChange={() => setCategory("task")}
                          className="sr-only"
                        />

                        <div className="flex items-center gap-2">
                          <span
                            className={`
                              h-4 w-4 rounded-full border-2
                              ${
                                category === "task"
                                  ? "border-[#ed6e2b] bg-[#ed6e2b] ring-2 ring-orange-100"
                                  : "border-slate-300"
                              }
                            `}
                          />

                          <span className="text-xs font-bold text-slate-700">
                            دستور مدیر
                          </span>
                        </div>
                      </label>

                      {tasks.length === 0 && (
                        <p className="mt-1.5 px-1 text-[10px] text-red-500">
                          ابلاغیه ندارید
                        </p>
                      )}
                    </div>

                    {/* Mission */}
                    <div>
                      <label
                        className={`
                          block rounded-xl border p-3
                          transition-all
                          ${
                            missions.length === 0
                              ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-50"
                              : category === "mission"
                                ? "cursor-pointer border-orange-300 bg-orange-50 ring-2 ring-orange-100"
                                : "cursor-pointer border-slate-200 bg-white hover:border-orange-200 hover:bg-orange-50/40"
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name="categoryRadio"
                          value="mission"
                          disabled={missions.length === 0}
                          checked={category === "mission"}
                          onChange={() => setCategory("mission")}
                          className="sr-only"
                        />

                        <div className="flex items-center gap-2">
                          <span
                            className={`
                              h-4 w-4 rounded-full border-2
                              ${
                                category === "mission"
                                  ? "border-[#ed6e2b] bg-[#ed6e2b] ring-2 ring-orange-100"
                                  : "border-slate-300"
                              }
                            `}
                          />

                          <span className="text-xs font-bold text-slate-700">
                            ماموریت
                          </span>
                        </div>
                      </label>

                      {missions.length === 0 && (
                        <p className="mt-1.5 px-1 text-[10px] text-red-500">
                          ماموریتی ندارید
                        </p>
                      )}
                    </div>

                    {/* Project */}
                    <div>
                      <label
                        className={`
                          block rounded-xl border p-3
                          transition-all
                          ${
                            projects.length === 0
                              ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-50"
                              : category === "project"
                                ? "cursor-pointer border-orange-300 bg-orange-50 ring-2 ring-orange-100"
                                : "cursor-pointer border-slate-200 bg-white hover:border-orange-200 hover:bg-orange-50/40"
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name="categoryRadio"
                          value="project"
                          disabled={projects.length === 0}
                          checked={category === "project"}
                          onChange={() => setCategory("project")}
                          className="sr-only"
                        />

                        <div className="flex items-center gap-2">
                          <span
                            className={`
                              h-4 w-4 rounded-full border-2
                              ${
                                category === "project"
                                  ? "border-[#ed6e2b] bg-[#ed6e2b] ring-2 ring-orange-100"
                                  : "border-slate-300"
                              }
                            `}
                          />

                          <span className="text-xs font-bold text-slate-700">
                            پروژه
                          </span>
                        </div>
                      </label>

                      {projects.length === 0 && (
                        <p className="mt-1.5 px-1 text-[10px] text-red-500">
                          پروژه‌ای ندارید
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Project */}
                {category === "project" && projects.length > 0 && (
                  <div>
                    <label className="mb-2 block text-xs font-bold text-slate-600">
                      انتخاب پروژه *
                    </label>

                    <select
                      name="projectId"
                      required
                      className="
                        w-full rounded-xl
                        border border-slate-200
                        bg-slate-50
                        px-3 py-2.5
                        text-sm text-slate-700
                        outline-none
                        transition-all
                        focus:border-[#ed6e2b]
                        focus:bg-white
                        focus:ring-4
                        focus:ring-orange-100
                      "
                    >
                      {projects.map((project: any) => (
                        <option
                          key={project.Project_ID}
                          value={project.Project_ID}
                        >
                          {project.Project_Name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Task */}
                {category === "task" && tasks.length > 0 && (
                  <div>
                    <label className="mb-2 block text-xs font-bold text-slate-600">
                      انتخاب ابلاغیه *
                    </label>

                    <select
                      name="taskId"
                      required
                      className="
                        w-full rounded-xl
                        border border-slate-200
                        bg-slate-50
                        px-3 py-2.5
                        text-sm text-slate-700
                        outline-none
                        transition-all
                        focus:border-[#ed6e2b]
                        focus:bg-white
                        focus:ring-4
                        focus:ring-orange-100
                      "
                    >
                      {tasks.map((task: any) => (
                        <option
                          key={task.Task_ID}
                          value={task.Task_ID}
                        >
                          {task.Title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Mission */}
                {category === "mission" && missions.length > 0 && (
                  <div>
                    <label className="mb-2 block text-xs font-bold text-slate-600">
                      انتخاب ماموریت *
                    </label>

                    <select
                      name="missionId"
                      required
                      className="
                        w-full rounded-xl
                        border border-slate-200
                        bg-slate-50
                        px-3 py-2.5
                        text-sm text-slate-700
                        outline-none
                        transition-all
                        focus:border-[#ed6e2b]
                        focus:bg-white
                        focus:ring-4
                        focus:ring-orange-100
                      "
                    >
                      {missions.map((mission: any) => (
                        <option
                          key={mission.Commute_ID}
                          value={mission.Commute_ID}
                        >
                          {mission.Destination}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Work Type */}
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-600">
                    نوع فعالیت *
                  </label>

                  <select
                    name="workTypeId"
                    required
                    className="
                      w-full rounded-xl
                      border border-slate-200
                      bg-slate-50
                      px-3 py-2.5
                      text-sm text-slate-700
                      outline-none
                      transition-all
                      focus:border-[#ed6e2b]
                      focus:bg-white
                      focus:ring-4
                      focus:ring-orange-100
                    "
                  >
                    {types.map((type: any) => (
                      <option
                        key={type.Work_Type_ID}
                        value={type.Work_Type_ID}
                      >
                        {type.Work_Type_Name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-600">
                    محل فعالیت *
                  </label>

                  <select
                    name="locationId"
                    required
                    className="
                      w-full rounded-xl
                      border border-slate-200
                      bg-slate-50
                      px-3 py-2.5
                      text-sm text-slate-700
                      outline-none
                      transition-all
                      focus:border-[#ed6e2b]
                      focus:bg-white
                      focus:ring-4
                      focus:ring-orange-100
                    "
                  >
                    {locations.map((location: any) => (
                      <option
                        key={location.Location_ID}
                        value={location.Location_ID}
                      >
                        {location.Location_Name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-600">
                    ضریب سختی کار (۱ تا ۱۰) *
                  </label>

                  <input
                    name="difficulty"
                    type="number"
                    min="1"
                    max="10"
                    required
                    defaultValue="5"
                    className="
                      w-full rounded-xl
                      border border-slate-200
                      bg-slate-50
                      px-3 py-2.5
                      text-sm text-slate-700
                      outline-none
                      transition-all
                      focus:border-[#ed6e2b]
                      focus:bg-white
                      focus:ring-4
                      focus:ring-orange-100
                    "
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-600">
                    شرح کار انجام شده *
                  </label>

                  <textarea
                    name="description"
                    rows={3}
                    required
                    placeholder="توضیحاتی در مورد فعالیت خود وارد کنید..."
                    className="
                      w-full resize-y rounded-xl
                      border border-slate-200
                      bg-slate-50
                      px-3 py-2.5
                      text-sm text-slate-700
                      outline-none
                      transition-all
                      placeholder:text-slate-400
                      focus:border-[#ed6e2b]
                      focus:bg-white
                      focus:ring-4
                      focus:ring-orange-100
                    "
                  />
                </div>

                {/* Error */}
                {formError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700">
                    {formError}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  className="
                    flex w-full items-center
                    justify-center gap-2
                    rounded-xl
                    bg-[#ed6e2b]
                    px-5 py-3.5
                    text-sm font-bold text-white
                    shadow-sm shadow-orange-200
                    transition-all
                    hover:bg-[#d95f20]
                    hover:shadow-md
                    active:scale-[0.99]
                  "
                >
                  <Save className="h-5 w-5" />
                  ثبت فعالیت
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="
            fixed bottom-6 left-1/2 z-[100]
            flex -translate-x-1/2
            items-center gap-2
            rounded-xl
            bg-slate-900
            px-4 py-3
            text-sm font-medium text-white
            shadow-xl
          "
        >
          <CheckCircle className="h-5 w-5 text-emerald-400" />
          {toast}
        </div>
      )}
    </div>
  );
}

