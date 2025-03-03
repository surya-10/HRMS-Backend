const db = require("../../model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const messageConfig = require("../../config/message");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const mongoose = require('mongoose');
dotenv.config();

const breakInfo = db.breakRecords;
const Employee = db.user;

exports.addBreaks = async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, breakdata, date } = req.body;

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        // console.log(startOfDay)

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        // console.log(endOfDay)

        const existingBreak = await breakInfo.findOne({
            userId,
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });

        if (existingBreak) {
            if (breakdata.endTime) {
                const breakToUpdate = existingBreak.breaks.find(
                    b => {
                        if (breakdata.breakName === 'Others') {
                            return b.breakName === breakdata.breakName &&
                                b.reason === breakdata.reason &&
                                !b.endTime;
                        }
                        return b.breakName === breakdata.breakName && !b.endTime;
                    }
                );

                if (breakToUpdate) {
                    breakToUpdate.endTime = breakdata.endTime;
                } else {
                    existingBreak.breaks.push(breakdata);
                }
            } else {
                existingBreak.breaks.push(breakdata);
            }
            await existingBreak.save();
            return res.status(200).json({ message: "Break updated", breaks: existingBreak });
        } else {
            const newBreak = new breakInfo({
                name,
                userId,
                date,
                breaks: [breakdata]
            });
            await newBreak.save();
            console.log(newBreak)
            return res.status(200).json({ message: "Break saved", breaks: newBreak });
        }
    } catch (error) {
        console.error("Error saving break:", error);
        return res.status(500).json({
            status: 500,
            error: error.message,
            message: "Error saving break"
        });
    }
}

exports.getBreakByDate = async (req, res) => {
    try {
        const { userId, date } = req.params;
        // console.log("surys data")
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const breakRecord = await breakInfo.findOne({
            userId,
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });
        // console.log(breakRecord)
        return res.status(200).json({
            breaks: breakRecord
        });
    } catch (error) {
        console.error("Error getting breaks:", error);
        return res.status(500).json({
            status: 500,
            error: error.message,
            message: "Error getting breaks"
        });
    }
}
exports.getAllBreaks = async (req, res) => {
    try {
        const { userId } = req.params;
        let breaks = await breakInfo.find({ userId });
        breaks = breaks.filter((data => data.date.toString().slice(0, 11) != new Date().toString().slice(0, 11)))
        // console.log(breaks)
        if (breaks.length == 0) {
            return res.status(400).json({ message: "No breaks found" })
        }
        return res.status(200).json({ message: "Data retrieved successfully", breaks: breaks.length > 0 ? breaks[breaks.length - 1] : 0 })

    } catch (error) {
        console.error("Error getting breaks:", error);
        return res.status(500).json({
            status: 500,
            error: error.message,
            message: "Error getting breaks"
        });
    }
}

exports.getTodayBreaksForAllEmployees = async (req, res) => {
    try {
        const { managerId } = req.params;

        // Get today's date range
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // First, get all employees under this manager
        const employees = await Employee.find({
            manager_id: managerId
        }, { password: 0 }).populate('role').populate('profession_id').populate('profile_id');

        const employeeIds = employees.map(emp => emp._id);

        // Get breaks for all these employees for today
        const todayBreaks = await breakInfo.find({
            userId: { $in: employeeIds },
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        }).populate({
            path: 'userId',
            select: '-password',
            populate: [
                { path: 'role' },
                { path: 'profession_id' },
                { path: 'profile_id' }
            ]
        });

        // Format the response
        const formattedBreaks = todayBreaks.map(breakRecord => {
            const employee = breakRecord.userId;
            // Calculate total break duration for the day
            const totalBreakDuration = breakRecord.breaks.reduce((total, b) => {
                if (b.startTime && b.endTime) {
                    const start = parseInt(b.startTime);
                    const end = parseInt(b.endTime);
                    return total + (end - start);
                }
                return total;
            }, 0);

            return {
                _id: breakRecord._id,
                employee: {
                    id: employee._id,
                    name: `${employee.first_name} ${employee.last_name}`,
                    designation: employee.profession_id?.designation || 'Employee',
                    role: employee.role?.role_value || 'Employee',
                    profileInfo: employee.profile_id || {}
                },
                totalBreakTime: formatDuration(totalBreakDuration),
                breaks: breakRecord.breaks.map(b => ({
                    breakName: b.breakName,
                    breakValue: b.breakValue || b.breakName,
                    startTime: new Date(parseInt(b.startTime)).toLocaleTimeString(),
                    endTime: b.endTime ? new Date(parseInt(b.endTime)).toLocaleTimeString() : null,
                    duration: b.endTime ? calculateDuration(parseInt(b.startTime), parseInt(b.endTime)) : 'Ongoing',
                    status: b.endTime ? 'Completed' : 'Ongoing'
                }))
            };
        });

        // Add employees who have no breaks today
        const employeesWithNoBreaks = employees
            .filter(emp => !todayBreaks.find(br => br.userId._id.toString() === emp._id.toString()))
            .map(emp => ({
                _id: null,
                employee: {
                    id: emp._id,
                    name: `${emp.first_name} ${emp.last_name}`,
                    designation: emp.profession_id?.designation || 'Employee',
                    role: emp.role?.role_value || 'Employee',
                    profileInfo: emp.profile_id || {}
                },
                totalBreakTime: '0 mins',
                breaks: []
            }));

        return res.status(200).json({
            status: 200,
            message: "Today's breaks retrieved successfully",
            data: [...formattedBreaks, ...employeesWithNoBreaks]
        });
    } catch (error) {
        console.error("Error getting today's breaks:", error);
        return res.status(500).json({
            status: 500,
            error: error.message,
            message: "Error retrieving today's breaks"
        });
    }
};

// Helper function to calculate duration between two times
function calculateDuration(startTime, endTime) {
    const diffMs = endTime - startTime;
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 60) {
        return `${diffMins} mins`;
    }
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
}

// Helper function to format total duration
function formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    
    if (hours === 0) {
        return `${minutes} mins`;
    }
    return `${hours}h ${remainingMins}m`;
}