import { Upload, Users, X, Edit, Save, Plus, Trash2 } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useGroupStore } from '../store/useGroupStore';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import toast from 'react-hot-toast';

const SettingModel = ({ groupData,setSelectedGroupData }) => {
    const [isEditMode, setIsEditMode] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [imagePreview, setImagePreview] = useState(null);
    const [membersToRemove, setMembersToRemove] = useState([]);
    
    const { authUser } = useAuthStore();
    const { users } = useChatStore();
    const { 
        updateGroup, 
        isUpdatingGroup,
        addMembers,
        removeMember 
    } = useGroupStore();

    useEffect(() => {
        if (groupData) {
            setGroupName(groupData?.name || "");
            // Extract just the IDs from members and filter out the current user
            const memberIds = groupData?.members
                .filter(member => member._id !== authUser?._id)
                .map(member => member._id);
            setSelectedUsers(memberIds || []);
            setImagePreview(groupData?.profilePic || groupData?.groupPic || null);
            setIsEditMode(false); // Reset to view mode when group data changes
            setMembersToRemove([]);
        }
    }, [groupData, authUser]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error("Image size should be less than 2MB");
                return;
            }
            
            if (!file.type.startsWith('image/')) {
                toast.error("Please upload an image file");
                return;
            }
        
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImagePreview(null);
    };
    
    const handleUserSelect = (userId) => {
        if (isEditMode) {
            if (selectedUsers.includes(userId)) {
                setSelectedUsers(selectedUsers.filter(id => id !== userId));
                
                // If this was an existing member, add to remove list
                const isExistingMember = groupData?.members.some(member => member._id === userId);
                if (isExistingMember) {
                    setMembersToRemove([...membersToRemove, userId]);
                }
            } else {
                setSelectedUsers([...selectedUsers, userId]);
                // Remove from the remove list if it was there
                setMembersToRemove(membersToRemove.filter(id => id !== userId));
            }
        }
    };
    
    // Get users not already in the group for adding
    const usersNotInGroup = users.filter(user => 
        user._id !== authUser?._id && 
        !groupData?.members.some(member => member._id === user._id)
    );
    
    // Get current group members for display/removal
    const groupMembers = users.filter(user => 
        user._id !== authUser?._id && 
        groupData?.members.some(member => member._id === user._id)
    );
    
    // Filter users based on search query and whether we're showing all users or just members
    const filteredUsers = isEditMode
        ? (searchQuery 
            ? usersNotInGroup.filter(user => user.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
            : usersNotInGroup)
        : groupMembers;

    const handleSave = async () => {
        if (!groupData?._id) return;
        
        try {
            // First update the basic group info
            const groupUpdateData = {
                name: groupName,
                ...(imagePreview !== groupData.groupPic && { groupPic: imagePreview })
            };
            
            await updateGroup(groupData._id, groupUpdateData);
            
            // Handle member additions (users selected but not already in group)
            const existingMemberIds = groupData.members.map(m => m._id);
            const newMemberIds = selectedUsers.filter(id => !existingMemberIds.includes(id));
            
            if (newMemberIds.length > 0) {
                await addMembers(groupData._id, newMemberIds);
            }
            
            // Handle member removals one by one
            for (const memberId of membersToRemove) {
                await removeMember(groupData._id, memberId);
            }
            
            setIsEditMode(false);
            setMembersToRemove([]);
        } catch (error) {
            toast.error("Failed to update group");
            console.error(error);
        }finally{
            document.getElementById('my_modal_4').close();
        }
    };

    const toggleEditMode = () => {
        setIsEditMode(!isEditMode);
        // Reset the member changes if canceling edit mode
        if (isEditMode) {
            const memberIds = groupData?.members
                .filter(member => member._id !== authUser?._id)
                .map(member => member._id);
            setSelectedUsers(memberIds || []);
            setMembersToRemove([]);
            setGroupName(groupData?.name || "");
            setImagePreview(groupData?.profilePic || groupData?.groupPic || null);
        }
    };

    return (
        <>
            <dialog id="my_modal_4" className="modal">
                <div className="bg-base-100 rounded-lg max-h-[90vh] overflow-auto modal-box w-11/12 max-w-5xl">
                    {/* Header */}
                    <div className=" border-b border-base-300 top-0 bg-base-100 z-10 flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            {groupData?.name} Details
                            {!isEditMode && (
                                <button 
                                    onClick={toggleEditMode}
                                    className="btn btn-sm btn-ghost btn-circle ml-2"
                                    title="Edit group"
                                >
                                    <Edit size={16} />
                                </button>
                            )}
                        </h2>
                        <div className="modal-action flex items-center gap-2 mb-4">
                            {isEditMode && (
                                <>
                                    <button 
                                        className="btn btn-sm btn-primary"
                                        onClick={handleSave}
                                        disabled={isUpdatingGroup}
                                    >
                                        {isUpdatingGroup ? (
                                            <span className="loading loading-spinner loading-xs"></span>
                                        ) : (
                                            <>
                                                <Save size={16} />
                                                Save
                                            </>
                                        )}
                                    </button>
                                    <button 
                                        className="btn btn-sm btn-outline"
                                        onClick={toggleEditMode}
                                        disabled={isUpdatingGroup}
                                    >
                                        Cancel
                                    </button>
                                </>
                            )}
                            <form method="dialog">
                                <button className="btn btn-sm btn-ghost btn-circle " onClick={()=>setSelectedGroupData(null)}>
                                    <X size={20}/>
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Group Image */}
                        <div className="flex justify-center">
                            {imagePreview ? (
                                <div className="relative">
                                    <img
                                        src={imagePreview}
                                        alt="Group preview"
                                        className="w-24 h-24 rounded-full object-cover border border-base-300"
                                    />
                                    {isEditMode && (
                                        <button
                                            onClick={handleRemoveImage}
                                            className="absolute -top-2 -right-2 btn btn-error btn-xs btn-circle"
                                            aria-label="Remove image"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <label className={`flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-base-300 rounded-full ${isEditMode ? 'cursor-pointer hover:border-primary' : ''} transition-colors`}>
                                    <div className="flex flex-col items-center justify-center">
                                        <Upload size={24} className="mb-1" />
                                        <span className="text-xs text-center">
                                            {isEditMode ? "Upload Photo" : "No Photo"}
                                        </span>
                                    </div>
                                    {isEditMode && (
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                        />
                                    )}
                                </label>
                            )}
                        </div>

                        {/* Group Name Input */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">Group Name</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Enter group name"
                                    className="input input-bordered w-full"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    disabled={!isEditMode}
                                />
                            </div>
                        </div>

                        {/* Members Section */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-medium text-lg flex items-center gap-2">
                                    <Users size={18} /> 
                                    {isEditMode ? "Manage Members" : "Members"}
                                </h3>
                                <div className="text-sm font-medium">
                                    {isEditMode ? (
                                        `${selectedUsers.length} selected`
                                    ) : (
                                        `${groupData?.members.length - 1} members` // Subtract 1 to exclude current user
                                    )}
                                </div>
                            </div>

                            {/* Search Bar - Only in Edit Mode */}
                            {isEditMode && (
                                <div className="form-control mb-3">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search users to add..."
                                            className="input input-bordered w-full pl-10"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                        <Users size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
                                    </div>
                                </div>
                            )}

                            {/* User Lists - Shows different content based on mode */}
                            <div className="border border-base-300 rounded-lg bg-base-100">
                                {isEditMode ? (
                                    <div className="flex flex-col">
                                        {/* Current Members Section */}
                                        <div className="p-3 border-b border-base-300 bg-base-200">
                                            <h4 className="font-medium flex items-center gap-2">
                                                <Trash2 size={16} className="text-error" /> 
                                                Remove Members
                                            </h4>
                                        </div>
                                        <ul className="divide-y divide-base-300 max-h-40 overflow-y-auto">
                                            {groupMembers.length > 0 ? (
                                                groupMembers.map(user => (
                                                    <li
                                                        key={`member-${user._id}`}
                                                        className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-base-200 transition-colors ${
                                                            !selectedUsers.includes(user._id) ? "bg-base-200 text-error" : ""
                                                        }`}
                                                        onClick={() => handleUserSelect(user._id)}
                                                    >
                                                        <div className="flex-shrink-0">
                                                            <input
                                                                type="checkbox"
                                                                className="checkbox checkbox-primary"
                                                                checked={selectedUsers.includes(user._id)}
                                                                onChange={() => {}}
                                                            />
                                                        </div>
                                                        <div className="avatar">
                                                            <div className="w-10 h-10 rounded-full border border-base-300">
                                                                <img
                                                                    src={user.profilePic || "/avatar.png"}
                                                                    alt={user.fullName}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-medium truncate">{user.fullName}</h4>
                                                        </div>
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="p-3 text-center text-base-content/60">
                                                    No members to remove
                                                </li>
                                            )}
                                        </ul>

                                        {/* Add New Members Section */}
                                        <div className="p-3 border-y border-base-300 bg-base-200 mt-4">
                                            <h4 className="font-medium flex items-center gap-2">
                                                <Plus size={16} className="text-success" /> 
                                                Add New Members
                                            </h4>
                                        </div>
                                        <ul className="divide-y divide-base-300 max-h-40 overflow-y-auto">
                                            {filteredUsers.length > 0 ? (
                                                filteredUsers.map(user => (
                                                    <li
                                                        key={`new-${user._id}`}
                                                        className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-base-200 transition-colors ${
                                                            selectedUsers.includes(user._id) ? "bg-base-200" : ""
                                                        }`}
                                                        onClick={() => handleUserSelect(user._id)}
                                                    >
                                                        <div className="flex-shrink-0">
                                                            <input
                                                                type="checkbox"
                                                                className="checkbox checkbox-primary"
                                                                checked={selectedUsers.includes(user._id)}
                                                                onChange={() => {}}
                                                            />
                                                        </div>
                                                        <div className="avatar">
                                                            <div className="w-10 h-10 rounded-full border border-base-300">
                                                                <img
                                                                    src={user.profilePic || "/avatar.png"}
                                                                    alt={user.fullName}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-medium truncate">{user.fullName}</h4>
                                                        </div>
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="p-3 text-center text-base-content/60">
                                                    {searchQuery ? "No users found" : "No users to add"}
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                ) : (
                                    // View Mode - Just display members
                                    <ul className="divide-y divide-base-300 max-h-60 overflow-y-auto">
                                        {groupMembers.length > 0 ? (
                                            groupMembers.map(user => (
                                                <li key={user._id} className="flex items-center gap-3 p-3">
                                                    <div className="avatar">
                                                        <div className="w-10 h-10 rounded-full border border-base-300">
                                                            <img
                                                                src={user.profilePic || "/avatar.png"}
                                                                alt={user.fullName}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-medium truncate">{user.fullName}</h4>
                                                    </div>
                                                </li>
                                            ))
                                        ) : (
                                            <li className="p-3 text-center text-base-content/60">
                                                No members in this group
                                            </li>
                                        )}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </dialog>
        </>
    )
}

export default SettingModel