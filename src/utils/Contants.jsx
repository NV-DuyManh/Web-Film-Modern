import { FaUsers, FaUserSecret } from "react-icons/fa";
import { MdCategory, MdDashboard, MdLocalMovies, MdOutlinePriceChange } from "react-icons/md";
import { RiVipDiamondFill } from "react-icons/ri";

export const LISTMENU = [
    {
        name: "Metadata",
        icon:  <MdCategory  />,
        subMenu: [
            {
                title: "Categories",
                path: "/categories"
            },
            {
                title: "Category Type",
                path: "/category_type"
            }
        ]
    },
    {
        name: "Movies",
        icon:  <MdLocalMovies />,
        subMenu: [
            {
                title: "Movies",
                path: "/movies"
            },
            {
                title: "Episodes",
                path: "/episodes"
            },
            {
                title: "ShowTimes",
                path: "/showTimes"
            }
        ]
    },
    {
        name: "Users",
        icon: <FaUsers />,
        subMenu: [
            {
                title: "Users",
                path: "/users"
            },
            {
                title: "Reviews",
                path: "/reviews"
            },
            {
                title: "Comments",
                path: "/comments"
            }
        ]
    },
    {
        name: "Cast",
        icon: <FaUserSecret />,
        subMenu: [
            {
                title: "Actors",
                path: "/actors"
            },
            {
                title: "Authors",
                path: "/authors"
            },
            {
                title: "Characters",
                path: "/characters"
            }
        ]
    },
    {
        name: "Plans",
        icon:   <MdOutlinePriceChange />,
        subMenu: [
            {
                title: "Plans",
                path: "/plans"
            },
            {
                title: "Features",
                path: "/features"
            },
            {
                title: "Packages",
                path: "/packages"
            }
        ]
    },
    {
        name: "VIP",
        icon: <RiVipDiamondFill />,
        subMenu: [
            {
                title: "RentMovies",
                path: "/rent_movies"
            },
            {
                title: "Subcriptions",
                path: "/subcriptions"
            }
        ]
    },

]