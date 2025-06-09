"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import LogoutModal from "./LogoutModal";
import { useTranslations } from "next-intl";

const Menu = () => {
  const { data: session } = useSession();
  const t = useTranslations();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [tooltip, setTooltip] = useState({ show: false, text: "", x: 0, y: 0 });
  const role = session?.user?.role;

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const closeLogoutModal = () => {
    setShowLogoutModal(false);
  };

  const showTooltip = (e: React.MouseEvent, text: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      show: true,
      text,
      x: rect.right + 10,
      y: rect.top + rect.height / 2,
    });
  };

  const hideTooltip = () => {
    setTooltip({ show: false, text: "", x: 0, y: 0 });
  };

  const menuItems = [
    {
      title: t("menu.sections.menu"),
      items: [
        {
          icon: "/home.png",
          label: t("menu.items.home"),
          href: role ? `/${role.toLowerCase()}` : "/",
          visible: ["admin", "teacher", "student", "parent"],
        },
        {
          icon: "/iconTeacher.png",
          label: t("menu.items.teachers"),
          href: "/list/teachers",
          visible: ["admin", "teacher"],
        },
        {
          icon: "/iconStudent.png",
          label: t("menu.items.students"),
          href: "/list/students",
          visible: ["admin", "teacher"],
        },
        {
          icon: "/iconParent.png",
          label: t("menu.items.parents"),
          href: "/list/parents",
          visible: ["admin", "teacher"],
        },
        {
          icon: "/subject.png",
          label: t("menu.items.subjects"),
          href: "/list/subjects",
          visible: ["admin"],
        },
        {
          icon: "/class.png",
          label: t("menu.items.classes"),
          href: "/list/classes",
          visible: ["admin", "teacher"],
        },
        {
          icon: "/lesson.png",
          label: t("menu.items.lessons"),
          href: "/list/lessons",
          visible: ["admin", "teacher"],
        },
        {
          icon: "/calendar.png",
          label: t("menu.items.schedules"),
          href: "/list/schedules",
          visible: ["admin"],
        },
        {
          icon: "/exam.png",
          label: t("menu.items.exams"),
          href: "/list/exams",
          visible: ["admin", "teacher", "student", "parent"],
        },
        {
          icon: "/assignment.png",
          label: t("menu.items.assignments"),
          href: "/list/assignments",
          visible: ["admin", "teacher", "student", "parent"],
        },
        {
          icon: "/result.png",
          label: t("menu.items.results"),
          href: "/list/results",
          visible: ["admin", "teacher", "student", "parent"],
        },
        {
          icon: "/attendance.png",
          label: t("menu.items.attendance"),
          href: "/list/attendance",
          visible: ["admin", "teacher", "student", "parent"],
        },
        {
          icon: "/calendar.png",
          label: t("menu.items.events"),
          href: "/list/events",
          visible: ["admin", "teacher", "student", "parent"],
        },
        {
          icon: "/message.png",
          label: t("menu.items.messages"),
          href: "/list/messages",
          visible: ["admin", "teacher", "student", "parent"],
        },
        {
          icon: "/announcement.png",
          label: t("menu.items.announcements"),
          href: "/list/announcements",
          visible: ["admin", "teacher", "student", "parent"],
        },
        {
          icon: "/lesson.png",
          label: t("menu.items.archivedLessons"),
          href: "/list/archived-lessons",
          visible: ["admin"],
        },
      ],
    },
    {
      title: t("menu.sections.other"),
      items: [
        {
          icon: "/profile.png",
          label: t("menu.items.profile"),
          href: "/profile",
          visible: ["admin", "teacher", "student", "parent"],
        },
        {
          icon: "/setting.png",
          label: t("menu.items.settings"),
          href: "/settings",
          visible: ["admin", "teacher", "student", "parent"],
        },
        {
          icon: "/logout.png",
          label: t("menu.items.logout"),
          href: "#",
          visible: ["admin", "teacher", "student", "parent"],
        },
      ],
    },
  ];

  return (
    <>
      <div className="mt-4 text-sm">
        {menuItems.map((i) => (
          <div className="flex flex-col gap-2" key={i.title}>
            <span className="hidden lg:block text-gray-400 font-light my-4">
              {i.title}
            </span>
            {i.items.map((item) => {
              if (role && item.visible.includes(role)) {
                // Special handling for logout
                if (item.label === t("menu.items.logout")) {
                  return (
                    <button
                      key={item.label}
                      onClick={handleLogoutClick}
                      onMouseEnter={(e) => showTooltip(e, item.label)}
                      onMouseLeave={hideTooltip}
                      className="flex items-center justify-center lg:justify-start gap-4 text-gray-500 py-2 md:px-2 rounded-md hover:bg-customSkyLight w-full text-left"
                    >
                      <Image src={item.icon} alt="" width={20} height={20} />
                      <span className="hidden lg:block">{item.label}</span>
                    </button>
                  );
                }

                // Regular menu items
                return (
                  <Link
                    href={item.href}
                    key={item.label}
                    onMouseEnter={(e) => showTooltip(e, item.label)}
                    onMouseLeave={hideTooltip}
                    className="flex items-center justify-center lg:justify-start gap-4 text-gray-500 py-2 md:px-2 rounded-md hover:bg-customSkyLight"
                  >
                    <Image src={item.icon} alt="" width={20} height={20} />
                    <span className="hidden lg:block">{item.label}</span>
                  </Link>
                );
              }
            })}
          </div>
        ))}

        {/* Tooltip */}
        {tooltip.show && (
          <div
            className="fixed z-50 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none lg:hidden"
            style={{
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
              transform: "translateY(-50%)",
            }}
          >
            {tooltip.text}
          </div>
        )}
      </div>

      <LogoutModal isOpen={showLogoutModal} onClose={closeLogoutModal} />
    </>
  );
};

export default Menu;
