import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  Building2,
  Lock,
  Unlock,
  FileText,
  Tag,
  Paperclip,
  Share2,
  Bookmark,
  Printer,
  RotateCw,
  Save,
  Check,
  Search,
  Plus,
  Trash2,
  X,
  MessageSquare,
  Clock,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ChevronRight,
  Info,
  KeyRound,
  Mail,
  MoreHorizontal,
  User,
  Heart,
  Copy,
  Link,
  Settings,
  Monitor,
  Edit3,
  ArrowLeft,
  Filter,
  Globe,
  GraduationCap,
  MapPin,
  Phone,
  Calendar,
  Activity,
  Upload,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { HIERARCHICAL_MODULES, STANDARD_ACTIONS } from '../utils/moduleRegistry';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

// Document-Level Permissions Matrix per Role (Screenshot 4: Exact Document Type breakdown)
const ROLE_DOC_PERMISSIONS = {
  'role-academics': [
    { doctype: 'Department', level: 0, ifOwner: '-', select: '-', read: true, write: true, create: true, delete: false, submit: false, cancel: false, amend: false, report: true, import: false, export: false, print: true, email: true, share: true },
    { doctype: 'Interest', level: 0, ifOwner: '-', select: '-', read: true, write: true, create: true, delete: false, submit: false, cancel: false, amend: false, report: true, import: false, export: false, print: true, email: true, share: true },
    { doctype: 'Menu Item', level: 0, ifOwner: '-', select: true, read: true, write: false, create: false, delete: false, submit: false, cancel: false, amend: false, report: true, import: false, export: false, print: true, email: false, share: false },
    { doctype: 'Sales Report', level: 0, ifOwner: '-', select: true, read: true, write: false, create: false, delete: false, submit: false, cancel: false, amend: false, report: true, import: false, export: false, print: true, email: false, share: false },
  ],
  'role-cashier': [
    { doctype: 'POS Invoice', level: 0, ifOwner: '-', select: true, read: true, write: true, create: true, delete: false, submit: true, cancel: false, amend: false, report: true, import: false, export: true, print: true, email: true, share: true },
    { doctype: 'Order', level: 0, ifOwner: '-', select: true, read: true, write: true, create: true, delete: false, submit: true, cancel: true, amend: false, report: true, import: false, export: true, print: true, email: true, share: true },
    { doctype: 'Dining Table', level: 0, ifOwner: '-', select: true, read: true, write: true, create: false, delete: false, submit: false, cancel: false, amend: false, report: true, import: false, export: false, print: true, email: false, share: false },
    { doctype: 'Customer', level: 0, ifOwner: '-', select: true, read: true, write: true, create: true, delete: false, submit: false, cancel: false, amend: false, report: true, import: false, export: false, print: false, email: false, share: false },
    { doctype: 'Menu Item', level: 0, ifOwner: '-', select: true, read: true, write: false, create: false, delete: false, submit: false, cancel: false, amend: false, report: false, import: false, export: false, print: true, email: false, share: false },
    { doctype: 'Kitchen KOT', level: 0, ifOwner: '-', select: true, read: true, write: false, create: true, delete: false, submit: true, cancel: false, amend: false, report: true, import: false, export: false, print: true, email: false, share: false },
  ],
  'role-kitchen-staff': [
    { doctype: 'Kitchen KOT Ticket', level: 0, ifOwner: '-', select: true, read: true, write: true, create: false, delete: false, submit: true, cancel: false, amend: false, report: true, import: false, export: false, print: true, email: false, share: false },
    { doctype: 'Menu Recipe / BOM', level: 0, ifOwner: '-', select: true, read: true, write: false, create: false, delete: false, submit: false, cancel: false, amend: false, report: false, import: false, export: false, print: true, email: false, share: false },
    { doctype: 'Stock Item', level: 0, ifOwner: '-', select: true, read: true, write: true, create: false, delete: false, submit: false, cancel: false, amend: false, report: true, import: false, export: false, print: false, email: false, share: false },
    { doctype: 'Order', level: 0, ifOwner: '-', select: true, read: true, write: false, create: false, delete: false, submit: false, cancel: false, amend: false, report: false, import: false, export: false, print: true, email: false, share: false },
  ],
  'role-store-mgr': [
    { doctype: 'POS Invoice', level: 0, ifOwner: '-', select: true, read: true, write: true, create: true, delete: true, submit: true, cancel: true, amend: true, report: true, import: false, export: true, print: true, email: true, share: true },
    { doctype: 'Order', level: 0, ifOwner: '-', select: true, read: true, write: true, create: true, delete: true, submit: true, cancel: true, amend: true, report: true, import: false, export: true, print: true, email: true, share: true },
    { doctype: 'Dining Table', level: 0, ifOwner: '-', select: true, read: true, write: true, create: true, delete: true, submit: false, cancel: false, amend: false, report: true, import: false, export: false, print: true, email: false, share: true },
    { doctype: 'Menu Item', level: 0, ifOwner: '-', select: true, read: true, write: true, create: true, delete: false, submit: true, cancel: false, amend: false, report: true, import: true, export: true, print: true, email: false, share: true },
    { doctype: 'Stock Item', level: 0, ifOwner: '-', select: true, read: true, write: true, create: true, delete: false, submit: true, cancel: false, amend: false, report: true, import: true, export: true, print: true, email: false, share: true },
    { doctype: 'Purchase Order', level: 0, ifOwner: '-', select: true, read: true, write: true, create: true, delete: false, submit: true, cancel: true, amend: false, report: true, import: false, export: true, print: true, email: true, share: true },
    { doctype: 'Operating Expense', level: 0, ifOwner: '-', select: true, read: true, write: true, create: true, delete: false, submit: true, cancel: false, amend: false, report: true, import: false, export: true, print: true, email: false, share: false },
    { doctype: 'Sales Report', level: 0, ifOwner: '-', select: true, read: true, write: false, create: false, delete: false, submit: false, cancel: false, amend: false, report: true, import: false, export: true, print: true, email: true, share: true },
  ],
  'role-sysadmin': [
    { doctype: 'Company', level: 0, ifOwner: '-', select: true, read: true, write: true, create: true, delete: true, submit: true, cancel: true, amend: true, report: true, import: true, export: true, print: true, email: true, share: true },
    { doctype: 'Branch Outlet', level: 0, ifOwner: '-', select: true, read: true, write: true, create: true, delete: true, submit: true, cancel: true, amend: true, report: true, import: true, export: true, print: true, email: true, share: true },
    { doctype: 'User', level: 0, ifOwner: '-', select: true, read: true, write: true, create: true, delete: true, submit: true, cancel: true, amend: true, report: true, import: true, export: true, print: true, email: true, share: true },
    { doctype: 'Role & Permission', level: 0, ifOwner: '-', select: true, read: true, write: true, create: true, delete: true, submit: true, cancel: true, amend: true, report: true, import: true, export: true, print: true, email: true, share: true },
    { doctype: 'POS Invoice', level: 0, ifOwner: '-', select: true, read: true, write: true, create: true, delete: true, submit: true, cancel: true, amend: true, report: true, import: true, export: true, print: true, email: true, share: true },
    { doctype: 'Order', level: 0, ifOwner: '-', select: true, read: true, write: true, create: true, delete: true, submit: true, cancel: true, amend: true, report: true, import: true, export: true, print: true, email: true, share: true },
    { doctype: 'Dining Table', level: 0, ifOwner: '-', select: true, read: true, write: true, create: true, delete: true, submit: true, cancel: true, amend: true, report: true, import: true, export: true, print: true, email: true, share: true },
    { doctype: 'Menu Item', level: 0, ifOwner: '-', select: true, read: true, write: true, create: true, delete: true, submit: true, cancel: true, amend: true, report: true, import: true, export: true, print: true, email: true, share: true },
    { doctype: 'Stock Inventory', level: 0, ifOwner: '-', select: true, read: true, write: true, create: true, delete: true, submit: true, cancel: true, amend: true, report: true, import: true, export: true, print: true, email: true, share: true },
    { doctype: 'Purchase Invoice', level: 0, ifOwner: '-', select: true, read: true, write: true, create: true, delete: true, submit: true, cancel: true, amend: true, report: true, import: true, export: true, print: true, email: true, share: true },
    { doctype: 'Operating Expense', level: 0, ifOwner: '-', select: true, read: true, write: true, create: true, delete: true, submit: true, cancel: true, amend: true, report: true, import: true, export: true, print: true, email: true, share: true },
    { doctype: 'Financial Report', level: 0, ifOwner: '-', select: true, read: true, write: true, create: true, delete: true, submit: true, cancel: true, amend: true, report: true, import: true, export: true, print: true, email: true, share: true },
  ]
};

// Default template for other roles
const getDefaultDocPermissions = (roleName) => [
  { doctype: 'Order', level: 0, ifOwner: '-', select: true, read: true, write: true, create: true, delete: false, submit: true, cancel: false, amend: false, report: true, import: false, export: true, print: true, email: true, share: true },
  { doctype: 'POS Invoice', level: 0, ifOwner: '-', select: true, read: true, write: true, create: false, delete: false, submit: false, cancel: false, amend: false, report: true, import: false, export: false, print: true, email: true, share: true },
  { doctype: 'Menu Item', level: 0, ifOwner: '-', select: true, read: true, write: false, create: false, delete: false, submit: false, cancel: false, amend: false, report: true, import: false, export: false, print: true, email: false, share: false },
  { doctype: 'Stock Item', level: 0, ifOwner: '-', select: true, read: true, write: false, create: false, delete: false, submit: false, cancel: false, amend: false, report: true, import: false, export: false, print: false, email: false, share: false },
  { doctype: 'Customer', level: 0, ifOwner: '-', select: true, read: true, write: true, create: true, delete: false, submit: false, cancel: false, amend: false, report: true, import: false, export: false, print: false, email: false, share: false },
  { doctype: 'Sales Report', level: 0, ifOwner: '-', select: true, read: true, write: false, create: false, delete: false, submit: false, cancel: false, amend: false, report: true, import: false, export: true, print: true, email: true, share: true },
];

export default function ERPUserCanvasPage() {
  const { user: currentUser, updateCurrentUser } = useAuth();
  const { showToast } = useToast();

  // View mode: 'list' or 'detail'
  const [viewMode, setViewMode] = useState('list');

  // Active Tab
  const [activeTab, setActiveTab] = useState('user_details');

  // Master Data
  const [usersList, setUsersList] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [moduleProfiles, setModuleProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Search & Filter
  const [roleSearch, setRoleSearch] = useState('');
  const [moduleSearch, setModuleSearch] = useState('');

  // User List filters
  const [listSearchQuery, setListSearchQuery] = useState('');
  const [listFilterStatus, setListFilterStatus] = useState('all');
  const [listFilterType, setListFilterType] = useState('all');

  const [searchParams] = useSearchParams();
  const queryUserId = searchParams.get('id');

  // UI State
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const actionsMenuRef = useRef(null);
  const fileInputRef = useRef(null);

  // Attachments State
  const [attachments, setAttachments] = useState([
    { id: 'att-1', name: 'Offer_Letter.pdf', size: '240 KB', date: '15 Jan 2025' },
    { id: 'att-2', name: 'ID_Proof_Aadhaar.pdf', size: '1.2 MB', date: '15 Jan 2025' }
  ]);

  // Live Activity Log
  const [activityLog, setActivityLog] = useState([]);

  // Settings Tab Collapsible Sections (Matching Frappe ERP Screenshot)
  const [navSettingsOpen, setNavSettingsOpen] = useState(true);
  const [listSettingsOpen, setListSettingsOpen] = useState(true);
  const [formSettingsOpen, setFormSettingsOpen] = useState(true);
  const [changePasswordOpen, setChangePasswordOpen] = useState(true);
  const [docFollowOpen, setDocFollowOpen] = useState(true);

  // Settings Values
  const [settingSearchBar, setSettingSearchBar] = useState(true);
  const [settingNotifications, setSettingNotifications] = useState(true);
  const [settingListSidebar, setSettingListSidebar] = useState(true);
  const [settingBulkActions, setSettingBulkActions] = useState(true);
  const [settingViewSwitcher, setSettingViewSwitcher] = useState(true);
  const [settingFormSidebar, setSettingFormSidebar] = useState(true);
  const [settingTimeline, setSettingTimeline] = useState(true);
  const [settingDashboard, setSettingDashboard] = useState(true);
  const [settingNewPassword, setSettingNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [settingLogoutAll, setSettingLogoutAll] = useState(true);
  const [settingDocEmail, setSettingDocEmail] = useState(true);
  const [settingDailyDigest, setSettingDailyDigest] = useState(true);

  // More Information tab additional fields
  const [draftGender, setDraftGender] = useState('Male');
  const [draftBirthDate, setDraftBirthDate] = useState('2004-10-17');
  const [draftLocation, setDraftLocation] = useState('Ahmedabad, Gujarat');
  const [draftBio, setDraftBio] = useState('');
  const [draftLinkedIn, setDraftLinkedIn] = useState('');
  const [draftGitHub, setDraftGitHub] = useState('');
  const [draftMedium, setDraftMedium] = useState('');
  const [educationRows, setEducationRows] = useState([{ school: 'Ahmedabad University', qualification: 'B.Com', year: '2026', grade: 'First' }]);

  // Working Draft Fields (Screenshot 2: User Details Basic Info)
  const [draftIsEnabled, setDraftIsEnabled] = useState(true);
  const [draftFirstName, setDraftFirstName] = useState('');
  const [draftMiddleName, setDraftMiddleName] = useState('');
  const [draftLastName, setDraftLastName] = useState('');
  const [draftFullName, setDraftFullName] = useState('');
  const [draftUsername, setDraftUsername] = useState('');
  const [draftEmail, setDraftEmail] = useState('');
  const [draftCountry, setDraftCountry] = useState('India');
  const [draftLanguage, setDraftLanguage] = useState('English');
  const [draftTimezone, setDraftTimezone] = useState('Asia/Kolkata');
  const [draftUserCategory, setDraftUserCategory] = useState('Staff');
  const [draftInstance, setDraftInstance] = useState('');
  const [draftAcceptTerms, setDraftAcceptTerms] = useState(false);
  const [draftPhone, setDraftPhone] = useState('');

  // Roles & Modules Draft State
  const [draftRoleId, setDraftRoleId] = useState('');
  const [draftRoles, setDraftRoles] = useState([]);
  const [draftAllowedModules, setDraftAllowedModules] = useState([]);
  const [draftActionPermissions, setDraftActionPermissions] = useState({});
  const [draftHasAllBranches, setDraftHasAllBranches] = useState(false);
  const [draftBranchIds, setDraftBranchIds] = useState([]);
  const [draftAssignedTo, setDraftAssignedTo] = useState('Admin');
  const [draftTags, setDraftTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');

  // Comments & Timeline
  const [newComment, setNewComment] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Modals & Forms State
  const [selectedRoleForModal, setSelectedRoleForModal] = useState(null); // Screenshot 4 Role Modal!
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role_id: 'role-cashier',
    has_all_branch_access: false,
    assignedBranchIds: ['branch-bopal'],
    user_category: 'Staff',
    country: 'India',
    language: 'English',
    timezone: 'Asia/Kolkata',
    password: 'password123'
  });

  // Load Master Data
  const loadMasterData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes, branchesRes] = await Promise.all([
        api.get('/erp/users'),
        api.get('/erp/roles'),
        api.get('/erp/branches')
      ]);

      const users = usersRes.data.users || [];
      setUsersList(users);
      setRoles(rolesRes.data.roles || []);
      setModuleProfiles(rolesRes.data.moduleProfiles || []);
      setBranches(branchesRes.data.branches || []);

      let targetId = queryUserId;
      if (!targetId && currentUser?.id) {
        const foundLogged = users.find(u => u.id === currentUser.id || u.email?.toLowerCase() === currentUser.email?.toLowerCase());
        if (foundLogged) targetId = foundLogged.id;
      }
      if (!targetId && users.length > 0) {
        targetId = users[0].id;
      }

      if (targetId) {
        setSelectedUserId(targetId);
        if (queryUserId) {
          setViewMode('detail');
          setActiveTab('user_details');
        }
      }
    } catch (err) {
      console.error('Failed to load ERP master data:', err);
      showToast('Error loading ERP master data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  // Listen for queryUserId param to open logged-in or specific user
  useEffect(() => {
    if (queryUserId && usersList.length > 0) {
      const match = usersList.find(u => u.id === queryUserId || u.email?.toLowerCase() === queryUserId.toLowerCase());
      if (match) {
        setSelectedUserId(match.id);
        setViewMode('detail');
        setActiveTab('user_details');
      }
    }
  }, [queryUserId, usersList]);

  // Global Ctrl+S shortcut to save changes in profile or new form
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        if (viewMode === 'new_user') {
          handleCreateNewUser();
        } else if (viewMode === 'detail') {
          handleSaveChanges();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, draftFullName, draftFirstName, draftLastName, draftEmail, draftIsEnabled, draftRoleId, draftRoles, draftAllowedModules, draftBranchIds, draftTags, attachments, newUserData]);

  // Populate Working Draft when Selected User changes
  const loadUserDetails = async (id) => {
    if (!id) return;
    try {
      const res = await api.get(`/erp/users/${id}`);
      const u = res.data.user;
      setSelectedUser(u);

      setDraftIsEnabled(u.status !== 'SUSPENDED');
      setDraftFirstName(u.first_name || u.name?.split(' ')[0] || '');
      setDraftMiddleName(u.middle_name || '');
      setDraftLastName(u.last_name || u.name?.split(' ').slice(1).join(' ') || '');
      setDraftFullName(u.full_name || u.name || '');
      setDraftUsername(u.username || u.email?.replace(/[@.]/g, '') || '');
      setDraftEmail(u.email || '');
      setDraftCountry(u.country || 'India');
      setDraftLanguage(u.language || 'English');
      setDraftTimezone(u.timezone || 'Asia/Kolkata');
      setDraftUserCategory(u.user_category || (u.has_all_branch_access ? 'Executive' : 'Staff'));
      setDraftInstance(u.instance || '');
      setDraftAcceptTerms(Boolean(u.accept_terms));
      setDraftPhone(u.phone || '');

      const primaryRoleId = u.role_id || u.roleId || 'role-cashier';
      setDraftRoleId(primaryRoleId);
      setDraftRoles(Array.isArray(u.roles) && u.roles.length > 0 ? u.roles : [primaryRoleId]);

      const mods = Array.isArray(u.allowed_modules) ? u.allowed_modules : (Array.isArray(u.allowedModules) ? u.allowedModules : ['pos', 'orders', 'tables']);
      setDraftAllowedModules(mods);
      setDraftActionPermissions(u.action_permissions || u.user_permissions || {});

      setDraftHasAllBranches(Boolean(u.has_all_branch_access));
      setDraftBranchIds(u.assigned_branch_ids || u.assignedBranchIds || []);
      setDraftTags(u.tags || []);

      if (u.attachments && Array.isArray(u.attachments) && u.attachments.length > 0) {
        setAttachments(u.attachments);
      } else {
        setAttachments([
          { id: 'att-1', name: `${u.first_name || 'Staff'}_Onboarding.pdf`, size: '240 KB', date: '15 Jan 2025' },
          { id: 'att-2', name: 'Identity_Verification_Aadhaar.pdf', size: '1.2 MB', date: '15 Jan 2025' }
        ]);
      }

      const liveActor = currentUser?.name || 'Aditya Vikram';
      setActivityLog([
        { id: 'act-1', time: 'Just now', event: `${liveActor} opened profile details` },
        { id: 'act-2', time: '2 hours ago', event: `${liveActor} updated FCM push token` },
        { id: 'act-3', time: '1 day ago', event: `${liveActor} logged in from Web Terminal (192.168.1.105)` },
        { id: 'act-4', time: '3 days ago', event: `${liveActor} verified assigned branch outlets` },
        { id: 'act-5', time: '1 week ago', event: `Security Audit: Verified RBAC Permissions for ${u.name || 'User'}` },
        { id: 'act-6', time: '2 weeks ago', event: u.audit_created || `Account registered by ${liveActor}` }
      ]);
    } catch (err) {
      console.error('Failed to load user details:', err);
      showToast('Error loading user profile', 'error');
    }
  };

  // Attachment Actions
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;
    const newAtt = {
      id: `att-${Date.now()}`,
      name: file.name,
      size: sizeStr,
      date: 'Just now'
    };
    setAttachments(prev => [newAtt, ...prev]);
    showToast(`Added attachment "${file.name}"`, 'success');
    const liveActor = currentUser?.name || 'Aditya Vikram';
    setActivityLog(prev => [
      { id: `act-${Date.now()}`, time: 'Just now', event: `${liveActor} uploaded attachment: ${file.name}` },
      ...prev
    ]);
    e.target.value = '';
  };

  const handleRemoveAttachment = (attId, attName) => {
    setAttachments(prev => prev.filter(a => a.id !== attId));
    showToast(`Removed "${attName}"`, 'info');
    const liveActor = currentUser?.name || 'Aditya Vikram';
    setActivityLog(prev => [
      { id: `act-${Date.now()}`, time: 'Just now', event: `${liveActor} removed attachment: ${attName}` },
      ...prev
    ]);
  };

  // Handle New User Creation from Desk Form
  const handleCreateNewUser = async () => {
    if (!newUserData.email || !newUserData.name) {
      showToast('Please provide both Full Name and Email Address', 'warning');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post('/erp/users', newUserData);
      const createdUser = res.data?.user || res.data;
      showToast(`User ${newUserData.name} created successfully`, 'success');
      await loadMasterData();
      if (createdUser?.id) {
        setSelectedUserId(createdUser.id);
        setViewMode('detail');
        setActiveTab('user_details');
      } else {
        setViewMode('list');
      }
    } catch (err) {
      console.error('Error creating user:', err);
      showToast(err.response?.data?.error || 'Error creating user', 'error');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (selectedUserId) {
      loadUserDetails(selectedUserId);
    }
  }, [selectedUserId]);

  // Close actions menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(e.target)) {
        setActionsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Navigate to user detail from list
  const openUserDetail = (userId) => {
    setSelectedUserId(userId);
    setViewMode('detail');
    setActiveTab('user_details');
  };

  // Roles Toggling
  const handleToggleRole = (roleId) => {
    setDraftRoles(prev => {
      const exists = prev.includes(roleId);
      const next = exists ? prev.filter(r => r !== roleId) : [...prev, roleId];
      if (next.length === 1) setDraftRoleId(next[0]);
      else if (!next.includes(draftRoleId) && next.length > 0) setDraftRoleId(next[0]);
      return next;
    });
  };

  // Modules Toggling
  const handleToggleModule = (modId, isChecked) => {
    setDraftAllowedModules(prev => {
      const exists = prev.includes(modId);
      if (isChecked && !exists) return [...prev, modId];
      if (!isChecked && exists) return prev.filter(m => m !== modId);
      return prev;
    });
  };

  const handleToggleParentModule = (parentId, isChecked) => {
    const parent = HIERARCHICAL_MODULES.find(p => p.id === parentId);
    if (!parent) return;
    const childIds = parent.children.map(c => c.id);
    
    setDraftAllowedModules(prev => {
      let next = [...prev];
      if (isChecked) {
        childIds.forEach(id => { if (!next.includes(id)) next.push(id); });
      } else {
        next = next.filter(id => !childIds.includes(id));
      }
      return next;
    });
  };
  
  const handleToggleAction = (modId, actionKey, isChecked) => {
    setDraftActionPermissions(prev => {
      const existing = prev[modId] || [];
      const updated = isChecked ? [...existing, actionKey] : existing.filter(a => a !== actionKey);
      return { ...prev, [modId]: updated };
    });
  };

  // Branch Toggling
  const handleToggleBranch = (branchId) => {
    setDraftBranchIds(prev => {
      if (prev.includes(branchId)) {
        if (prev.length <= 1) {
          showToast('User must have at least one designated outlet', 'warning');
          return prev;
        }
        return prev.filter(id => id !== branchId);
      }
      return [...prev, branchId];
    });
  };

  // Save Changes
  const handleSaveChanges = async () => {
    if (!selectedUserId) return;
    setSaving(true);
    try {
      const computedName = draftFullName.trim() || `${draftFirstName} ${draftLastName}`.trim() || selectedUser.name;
      const payload = {
        name: computedName,
        full_name: computedName,
        first_name: draftFirstName,
        middle_name: draftMiddleName,
        last_name: draftLastName,
        username: draftUsername,
        email: draftEmail,
        country: draftCountry,
        language: draftLanguage,
        timezone: draftTimezone,
        user_category: draftUserCategory,
        instance: draftInstance,
        accept_terms: draftAcceptTerms,
        phone: draftPhone,
        status: draftIsEnabled ? 'ACTIVE' : 'SUSPENDED',
        role_id: draftRoleId || draftRoles[0] || 'role-cashier',
        roles: draftRoles.length > 0 ? draftRoles : [draftRoleId || 'role-cashier'],
        allowed_modules: draftAllowedModules,
        allowedModules: draftAllowedModules,
        action_permissions: draftActionPermissions,
        user_permissions: draftActionPermissions,
        has_all_branch_access: draftHasAllBranches,
        assignedBranchIds: draftBranchIds,
        assigned_to: draftAssignedTo,
        tags: draftTags,
        actionName: 'SECURITY_MATRIX_CONFIG_SAVED'
      };

      await api.put(`/erp/users/${selectedUserId}`, payload);
      showToast('Saved', 'success');

      const liveActor = currentUser?.name || 'Aditya Vikram';
      setActivityLog(prev => [
        { id: `act-${Date.now()}`, time: 'Just now', event: `${liveActor} saved profile changes and permissions` },
        ...prev
      ]);

      if (currentUser?.id === selectedUserId && updateCurrentUser) {
        updateCurrentUser({
          name: computedName,
          roleId: payload.role_id,
          roles: payload.roles,
          allowed_modules: payload.allowed_modules,
          allowedModules: payload.allowed_modules,
          has_all_branch_access: payload.has_all_branch_access,
          assignedBranchIds: payload.assignedBranchIds
        });
      }

      await loadUserDetails(selectedUserId);
      const refreshList = await api.get('/erp/users');
      setUsersList(refreshList.data.users || []);
    } catch (err) {
      console.error('Save failed:', err);
      showToast(err.response?.data?.error || 'Failed to save changes', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Comments
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedUserId) return;
    setCommentSubmitting(true);
    const commentText = newComment.trim();
    const liveActor = currentUser?.name || 'Aditya Vikram';
    try {
      await api.post(`/erp/users/${selectedUserId}/comments`, { content: commentText });
      setNewComment('');
      showToast('Comment posted', 'info');
      setActivityLog(prev => [
        { id: `act-${Date.now()}`, time: 'Just now', event: `${liveActor} posted a comment: "${commentText.slice(0, 30)}..."` },
        ...prev
      ]);
      await loadUserDetails(selectedUserId);
    } catch (err) {
      showToast('Failed to add comment', 'error');
    } finally {
      setCommentSubmitting(false);
    }
  };

  // Tags
  const handleAddTag = (e) => {
    e.preventDefault();
    if (!newTagInput.trim()) return;
    if (!draftTags.includes(newTagInput.trim())) setDraftTags(prev => [...prev, newTagInput.trim()]);
    setNewTagInput('');
  };
  const handleRemoveTag = (tag) => setDraftTags(prev => prev.filter(t => t !== tag));

  // Filtered Roles
  const filteredRoles = roles.filter(r =>
    r.name.toLowerCase().includes(roleSearch.toLowerCase())
  );

  // Filtered Modules
  const filteredModules = moduleProfiles.filter(m =>
    m.name.toLowerCase().includes(moduleSearch.toLowerCase()) ||
    m.domain?.toLowerCase().includes(moduleSearch.toLowerCase())
  );

  // Modal Document Permissions List for clicked role (Screenshot 4)
  const roleDocPermissions = selectedRoleForModal
    ? (ROLE_DOC_PERMISSIONS[selectedRoleForModal.id] || getDefaultDocPermissions(selectedRoleForModal.name))
    : [];

  // Filtered user list
  const filteredUserList = usersList.filter(u => {
    const matchSearch = listSearchQuery === '' ||
      u.name?.toLowerCase().includes(listSearchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(listSearchQuery.toLowerCase()) ||
      u.username?.toLowerCase().includes(listSearchQuery.toLowerCase());
    const matchStatus = listFilterStatus === 'all' ||
      (listFilterStatus === 'active' && u.status !== 'SUSPENDED') ||
      (listFilterStatus === 'disabled' && u.status === 'SUSPENDED');
    const matchType = listFilterType === 'all' ||
      (listFilterType === 'system' && (u.role === 'owner' || u.role === 'admin')) ||
      (listFilterType === 'regular' && u.role !== 'owner' && u.role !== 'admin');
    return matchSearch && matchStatus && matchType;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f5f6] flex items-center justify-center p-6 text-xs text-slate-500">
        <div className="w-6 h-6 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ==================== USER LIST VIEW ====================
  if (viewMode === 'list') {
    return (
      <div className="min-h-screen bg-[#f4f5f6] text-slate-800 font-sans text-xs">
        {/* List Page Header */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-500" />
            <h1 className="text-sm font-bold text-slate-900">User</h1>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500">{filteredUserList.length} records</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search users..."
                value={listSearchQuery}
                onChange={e => setListSearchQuery(e.target.value)}
                className="pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs focus:outline-none focus:bg-white w-48"
              />
            </div>
            <button
              onClick={() => setViewMode('new_user')}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              New
            </button>
          </div>
        </div>

        {/* List Body — sidebar + table */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex gap-5 items-start">

          {/* Left Filter Sidebar */}
          <div className="hidden lg:block w-44 shrink-0 space-y-4">
            {/* Status filter */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 space-y-2 shadow-2xs">
              <p className="font-semibold text-slate-700 text-[11px] uppercase tracking-wide">Status</p>
              {[['all', 'All'], ['active', 'Active'], ['disabled', 'Disabled']].map(([val, label]) => (
                <label key={val} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="listStatus"
                    value={val}
                    checked={listFilterStatus === val}
                    onChange={() => setListFilterStatus(val)}
                    className="text-slate-900 focus:ring-0"
                  />
                  <span className={listFilterStatus === val ? 'text-slate-900 font-medium' : 'text-slate-600'}>{label}</span>
                </label>
              ))}
            </div>

            {/* User Type filter */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 space-y-2 shadow-2xs">
              <p className="font-semibold text-slate-700 text-[11px] uppercase tracking-wide">User Type</p>
              {[['all', 'All'], ['system', 'System User'], ['regular', 'Regular Staff']].map(([val, label]) => (
                <label key={val} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="listType"
                    value={val}
                    checked={listFilterType === val}
                    onChange={() => setListFilterType(val)}
                    className="text-slate-900 focus:ring-0"
                  />
                  <span className={listFilterType === val ? 'text-slate-900 font-medium' : 'text-slate-600'}>{label}</span>
                </label>
              ))}
            </div>

            {/* Created By */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
              <p className="font-semibold text-slate-700 text-[11px] uppercase tracking-wide mb-2">Created By</p>
              <div className="space-y-1">
                {['Administrator', 'CEO'].map(name => (
                  <div key={name} className="text-slate-600 hover:text-slate-900 cursor-pointer py-0.5 hover:underline">{name}</div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
              <p className="font-semibold text-slate-700 text-[11px] uppercase tracking-wide mb-2">Tags</p>
              <div className="space-y-1">
                {['staff', 'admin', 'cashier', 'kitchen'].map(tag => (
                  <div key={tag} className="text-blue-600 hover:underline cursor-pointer py-0.5">{tag}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Table */}
          <div className="flex-1 bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                  <th className="px-4 py-2.5 w-8">
                    <input type="checkbox" className="rounded border-slate-300 focus:ring-0" />
                  </th>
                  <th className="px-3 py-2.5">ID</th>
                  <th className="px-3 py-2.5">Full Name</th>
                  <th className="px-3 py-2.5">Username</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">User Type</th>
                  <th className="px-3 py-2.5">Last Updated On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUserList.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No users found</td></tr>
                ) : filteredUserList.map((u, idx) => {
                  const isActive = u.status !== 'SUSPENDED';
                  const isSystem = u.role === 'owner' || u.role === 'admin';
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => openUserDetail(u.id)}
                    >
                      <td className="px-4 py-2.5" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" className="rounded border-slate-300 focus:ring-0" />
                      </td>
                      <td className="px-3 py-2.5 font-mono text-blue-700 hover:underline text-[11px]">
                        {String(idx + 1).padStart(5, '0')}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                            {u.name?.charAt(0) || '?'}
                          </div>
                          <span className="font-medium text-slate-900 hover:text-blue-700">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-600">{u.username || u.email?.split('@')[0]}</td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-600">
                        {isSystem ? 'System User' : 'Regular Staff'}
                      </td>
                      <td className="px-3 py-2.5 text-slate-500 text-[11px]">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Table Footer */}
            <div className="border-t border-slate-200 px-4 py-2 bg-slate-50 flex items-center justify-between">
              <span className="text-slate-500">{filteredUserList.length} of {usersList.length} records</span>
              <div className="flex items-center gap-2">
                <button className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-40" disabled>‹ Prev</button>
                <button className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-40" disabled>Next ›</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW MODE: NEW USER (Full Desk Page Layout Matching NewPurchaseOrderPage)
  // =========================================================================
  if (viewMode === 'new_user') {
    return (
      <div className="min-h-screen bg-[#f4f5f6] text-slate-800 pb-16 font-sans text-xs">
        {/* TOP DESK HEADER */}
        <div className="sticky top-12 z-30 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="flex items-center gap-1.5 px-2.5 py-1 text-slate-600 hover:text-slate-900 border border-slate-200 rounded hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Users</span>
              </button>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <h1 className="text-sm font-bold text-slate-900 tracking-tight">New User</h1>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Not Saved
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="btn-tactile px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded text-slate-700 font-medium shadow-2xs text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNewUser}
                disabled={saving}
                className="btn-tactile flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded font-medium shadow-2xs hover:shadow-xs transition-all text-xs cursor-pointer"
                title="Save User (Ctrl+S)"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Creating...' : 'Save User'}</span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-[10px] text-slate-300 rounded font-mono">Ctrl+S</kbd>
              </button>
            </div>
          </div>
        </div>

        {/* NEW USER FORM BODY (Full Desk Page Layout) */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Card 1: Basic Information */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Basic Information</h2>
                <p className="text-slate-500 text-[11px]">Personal details and identity for ERP account</p>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Section 1</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-slate-700 font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Patel"
                  value={newUserData.name}
                  onChange={e => setNewUserData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">First Name</label>
                <input
                  type="text"
                  placeholder="e.g. Vikram"
                  value={newUserData.first_name || ''}
                  onChange={e => setNewUserData(prev => ({ ...prev, first_name: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Last Name</label>
                <input
                  type="text"
                  placeholder="e.g. Patel"
                  value={newUserData.last_name || ''}
                  onChange={e => setNewUserData(prev => ({ ...prev, last_name: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="vikram@abcfoods.com"
                  value={newUserData.email}
                  onChange={e => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Mobile Phone</label>
                <input
                  type="tel"
                  placeholder="+91 98250 12345"
                  value={newUserData.phone || ''}
                  onChange={e => setNewUserData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">User Category</label>
                <select
                  value={newUserData.user_category || 'Staff'}
                  onChange={e => setNewUserData(prev => ({ ...prev, user_category: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:outline-none"
                >
                  <option value="Staff">Regular Staff</option>
                  <option value="Cashier">POS Cashier</option>
                  <option value="Kitchen Staff">Kitchen Staff</option>
                  <option value="Store Manager">Store Manager</option>
                  <option value="Executive">Executive / Management</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Time Zone</label>
                <input
                  type="text"
                  value={newUserData.timezone || 'Asia/Kolkata'}
                  onChange={e => setNewUserData(prev => ({ ...prev, timezone: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Role & Outlets Authorization */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Role & Branch Scope</h2>
                <p className="text-slate-500 text-[11px]">RBAC security permissions and outlet access boundaries</p>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Section 2</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Primary Role *</label>
                <select
                  value={newUserData.role_id}
                  onChange={e => setNewUserData(prev => ({ ...prev, role_id: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs focus:outline-none font-medium"
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name} — {r.description || r.name}</option>
                  ))}
                </select>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={newUserData.has_all_branch_access}
                    onChange={e => setNewUserData(prev => ({ ...prev, has_all_branch_access: e.target.checked }))}
                    className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                  />
                  <span>Allow Access to All Restaurant Branches (Consolidated Scope)</span>
                </label>

                {!newUserData.has_all_branch_access && (
                  <div>
                    <label className="block text-slate-600 font-medium mb-1.5 text-[11px]">Designated Branch Outlets:</label>
                    <div className="flex flex-wrap gap-2">
                      {branches.map(b => {
                        const checked = (newUserData.assignedBranchIds || []).includes(b.id);
                        return (
                          <button
                            type="button"
                            key={b.id}
                            onClick={() => {
                              const curr = newUserData.assignedBranchIds || [];
                              const next = checked ? curr.filter(id => id !== b.id) : [...curr, b.id];
                              setNewUserData(prev => ({ ...prev, assignedBranchIds: next.length > 0 ? next : [b.id] }));
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all ${
                              checked
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                            }`}
                          >
                            <Building2 className="w-3 h-3" />
                            <span>{b.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 3: Security & Credentials */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Security Credentials</h2>
                <p className="text-slate-500 text-[11px]">Set initial password and account active state</p>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Section 3</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Initial Password</label>
                <input
                  type="password"
                  value={newUserData.password || 'password123'}
                  onChange={e => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs font-mono"
                />
              </div>

              <div className="flex flex-col justify-center space-y-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-slate-300 text-slate-900 focus:ring-0"
                  />
                  <span>Account Enabled (Ready to log in)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-slate-300 text-slate-900 focus:ring-0"
                  />
                  <span>Send onboarding credentials email</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f5f6] text-slate-800 pb-16 font-sans text-xs">

      {/* TOP TITLE & ACTION BAR */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          
          {/* Breadcrumb + Title + Status */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Breadcrumb */}
            <button
              onClick={() => setViewMode('list')}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-xs font-medium transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              <span>User</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <h1 className="text-sm font-bold text-slate-900 tracking-tight">
              {draftFullName || selectedUser?.name || 'Raj Gupta'}
            </h1>
            <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
              draftIsEnabled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                : 'bg-rose-50 text-rose-700 border-rose-200/80'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${draftIsEnabled ? 'bg-emerald-500 status-dot-pulse' : 'bg-rose-500'}`} />
              {draftIsEnabled ? 'Active' : 'Suspended'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const primary = roles.find(r => r.id === draftRoleId) || roles[0];
                setSelectedRoleForModal(primary);
              }}
              className="btn-tactile hover-lift px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded text-slate-700 font-medium flex items-center gap-1 shadow-2xs text-xs"
            >
              <span>Permissions</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => setPasswordModalOpen(true)}
              className="btn-tactile hover-lift px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded text-slate-700 font-medium flex items-center gap-1 shadow-2xs text-xs"
            >
              <span>Password</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => showToast(`Credentials email sent to ${draftEmail}`, 'info')}
              className="btn-tactile hover-lift hidden sm:inline-block px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded text-slate-700 font-medium shadow-2xs text-xs"
            >
              Create User Email
            </button>

            {/* Reload */}
            <button
              type="button"
              onClick={() => { loadUserDetails(selectedUserId); showToast('Reloaded user data', 'info'); }}
              title="Reload from server"
              className="btn-tactile p-1.5 text-slate-500 hover:text-slate-800 border border-slate-300 rounded bg-white hover:bg-slate-50 shadow-2xs"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            {/* Save */}
            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={saving}
              className="btn-tactile flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded font-medium shadow-2xs hover:shadow-xs transition-all duration-150 cursor-pointer text-xs"
              title="Save Changes (Ctrl+S)"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save'}</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-[10px] text-slate-300 rounded font-mono">Ctrl+S</kbd>
            </button>

            {/* 3-dot Actions Menu */}
            <div className="relative" ref={actionsMenuRef}>
              <button
                type="button"
                onClick={() => setActionsMenuOpen(v => !v)}
                className="btn-tactile p-1.5 text-slate-500 hover:text-slate-800 border border-slate-300 rounded bg-white hover:bg-slate-50 shadow-2xs"
                title="More actions"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>

              {actionsMenuOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded shadow-lg z-30 w-48 py-1">
                  {[
                    { icon: <Printer className="w-3.5 h-3.5" />, label: 'Print', action: () => window.print() },
                    { icon: <Mail className="w-3.5 h-3.5" />, label: 'Email', action: () => showToast(`Email sent to ${draftEmail}`, 'info') },
                    { icon: <Search className="w-3.5 h-3.5" />, label: 'Jump to field', action: () => showToast('Jump to field...', 'info') },
                    { icon: <Link className="w-3.5 h-3.5" />, label: 'Links', action: () => showToast('Links panel...', 'info') },
                    { icon: <Copy className="w-3.5 h-3.5" />, label: 'Copy to Clipboard', action: () => { navigator.clipboard?.writeText(draftEmail); showToast('Copied to clipboard', 'success'); } },
                    { icon: <RotateCw className="w-3.5 h-3.5" />, label: 'Reload', action: () => { loadUserDetails(selectedUserId); showToast('Reloaded', 'info'); } },
                    { icon: <Settings className="w-3.5 h-3.5" />, label: 'Customize', action: () => showToast('Customize layout...', 'info') },
                    { icon: <Monitor className="w-3.5 h-3.5" />, label: 'Set Desktop Icon', action: () => showToast('Desktop icon set', 'success') },
                    { icon: <Edit3 className="w-3.5 h-3.5" />, label: 'Edit DictType', action: () => showToast('Edit DictType...', 'info') },
                  ].map(item => (
                    <button
                      key={item.label}
                      onClick={() => { item.action(); setActionsMenuOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-slate-700 hover:bg-slate-50 text-left transition-colors"
                    >
                      <span className="text-slate-400">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 5 TABS STRIP (Screenshot 2: User Details, Roles & Permissions, More Information, Settings, Connections) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-6 font-medium border-t border-slate-100 overflow-x-auto text-xs">
            <button
              onClick={() => setActiveTab('user_details')}
              className={`py-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'user_details'
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              User Details
            </button>

            <button
              onClick={() => setActiveTab('roles_permissions')}
              className={`py-2 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'roles_permissions'
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Roles & Permissions</span>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-mono border border-slate-200">
                {draftAllowedModules.length} Modules
              </span>
            </button>

            <button
              onClick={() => setActiveTab('more_info')}
              className={`py-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'more_info'
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              More Information
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`py-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Settings
            </button>

            <button
              onClick={() => setActiveTab('connections')}
              className={`py-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'connections'
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Connections
            </button>
          </div>
        </div>
      </div>

      {/* TWO-COLUMN WORKSPACE BODY */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

          {/* LEFT SIDEBAR (Screenshot 1 & 2: Portrait, Assigned To, Attachments, Tags, Comments, Activity) */}
          <div className="lg:col-span-3 space-y-4">

            {/* User Photo, Follow Button & Switcher */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-2">
                  <img
                    src={selectedUser?.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80'}
                    alt={draftFullName || 'User Portrait'}
                    className="w-24 h-28 rounded-lg object-cover border border-slate-200"
                  />
                  <span className={`absolute bottom-1 right-1 w-3 h-3 rounded-full border-2 border-white ${draftIsEnabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                </div>
                <p className="font-semibold text-slate-900">{draftFullName || selectedUser?.name}</p>
                <p className="text-[11px] text-slate-500 font-mono break-all">{draftEmail}</p>

                {/* Quick Staff Switcher Dropdown */}
                <div className="w-full mt-2 pt-2 border-t border-slate-100">
                  <select
                    value={selectedUserId || ''}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none cursor-pointer"
                  >
                    {usersList.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Attachments Section - Editable (Add & Remove) */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-700 font-semibold text-xs">Attachments</span>
                  <span className="text-[10px] text-slate-400">({attachments.length})</span>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload attachment"
                  className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="space-y-1.5">
                {attachments.length === 0 ? (
                  <p className="text-slate-400 italic text-[11px] py-1 text-center">No attachments uploaded</p>
                ) : (
                  attachments.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-1.5 bg-slate-50 hover:bg-slate-100/80 rounded-lg border border-slate-200/80 text-[11px] group transition-colors">
                      <div className="flex items-center gap-1.5 truncate min-w-0 mr-1">
                        <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate text-slate-700 font-medium">{file.name}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] text-slate-400 font-mono">{file.size}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(file.id, file.name)}
                          className="p-0.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 opacity-80 group-hover:opacity-100 transition-colors"
                          title="Delete attachment"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full mt-1.5 py-1.5 px-2 border border-dashed border-slate-300 hover:border-slate-400 rounded-lg text-[11px] text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Upload className="w-3 h-3 text-slate-400" />
                  <span>Upload File</span>
                </button>
              </div>
            </div>

            {/* Tags (+ icon) */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-slate-500 font-medium">Tags</span>
                <Tag className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {draftTags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-full text-slate-700 border border-slate-200 text-[11px]">
                    <span>{tag}</span>
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="text-slate-400 hover:text-slate-700">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
              <form onSubmit={handleAddTag} className="flex gap-1.5">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  placeholder="Add tag..."
                  className="flex-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none"
                />
                <button type="submit" className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 rounded-lg font-medium text-slate-700">
                  Add
                </button>
              </form>
            </div>

            {/* Comments Box (Screenshot 1 & 2) */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 space-y-2 shadow-2xs">
              <span className="font-semibold text-slate-800 block">Comments</span>
              <form onSubmit={handleAddComment} className="space-y-1.5">
                <textarea
                  rows={2}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Type a reply / comment"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={commentSubmitting || !newComment.trim()}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg font-medium"
                  >
                    Post
                  </button>
                </div>
              </form>

              {/* Feed */}
              {selectedUser?.comments && selectedUser.comments.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100 max-h-40 overflow-y-auto">
                  {selectedUser.comments.map(c => (
                    <div key={c.id} className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-semibold text-slate-800">{c.author_name}</span>
                        <span>{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-700 mt-0.5">{c.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activity Stream - Live with Active User */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-slate-700" />
                  <span className="font-semibold text-slate-800">Activity</span>
                </div>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
              <div className="space-y-2 text-[11px] text-slate-600 max-h-56 overflow-y-auto pr-1">
                {activityLog.length === 0 ? (
                  <p className="text-slate-400 italic text-center py-2">No activity recorded</p>
                ) : (
                  activityLog.map((item) => (
                    <div key={item.id} className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                      <div className="leading-snug">
                        <span className="text-slate-800 font-medium">{item.event}</span>
                        <span className="text-slate-400 ml-1 font-mono text-[10px]">· {item.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* RIGHT MAIN PANEL */}
          <div className="lg:col-span-9 space-y-4">

            {/* ========================================================================= */}
            {/* TAB 1: USER DETAILS (Matching Screenshot 2 EXACTLY: Basic Info + Enabled) */}
            {/* ========================================================================= */}
            {activeTab === 'user_details' && (
              <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 space-y-5 shadow-2xs">
                
                {/* ☑ Enabled Checkbox (Screenshot 2) */}
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <input
                    type="checkbox"
                    id="user-enabled-check"
                    checked={draftIsEnabled}
                    onChange={(e) => setDraftIsEnabled(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="user-enabled-check" className="font-semibold text-slate-800 cursor-pointer">
                    Enabled
                  </label>
                </div>

                {/* Section: Basic Info (Screenshot 2) */}
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 mb-3">Basic Info</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Email * */}
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Email *</label>
                      <input
                        type="email"
                        value={draftEmail}
                        onChange={(e) => setDraftEmail(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:border-slate-400 font-mono text-xs"
                      />
                    </div>

                    {/* Full Name */}
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Full Name</label>
                      <input
                        type="text"
                        value={draftFullName}
                        onChange={(e) => setDraftFullName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:border-slate-400 text-xs"
                      />
                    </div>

                    {/* First Name * */}
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">First Name *</label>
                      <input
                        type="text"
                        value={draftFirstName}
                        onChange={(e) => setDraftFirstName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:border-slate-400 text-xs"
                      />
                    </div>

                    {/* Username */}
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Username</label>
                      <input
                        type="text"
                        value={draftUsername}
                        onChange={(e) => setDraftUsername(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:border-slate-400 font-mono text-xs"
                      />
                    </div>

                    {/* Middle Name */}
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Middle Name</label>
                      <input
                        type="text"
                        value={draftMiddleName}
                        onChange={(e) => setDraftMiddleName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:border-slate-400 text-xs"
                      />
                    </div>

                    {/* Country */}
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Country</label>
                      <input
                        type="text"
                        value={draftCountry}
                        onChange={(e) => setDraftCountry(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:border-slate-400 text-xs"
                      />
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Last Name</label>
                      <input
                        type="text"
                        value={draftLastName}
                        onChange={(e) => setDraftLastName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:border-slate-400 text-xs"
                      />
                    </div>

                    {/* Language */}
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Language</label>
                      <select
                        value={draftLanguage}
                        onChange={(e) => setDraftLanguage(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none text-xs"
                      >
                        <option value="English">English</option>
                        <option value="Hindi">Hindi (हिंदी)</option>
                        <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                      </select>
                    </div>

                    {/* Time Zone */}
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Time Zone</label>
                      <select
                        value={draftTimezone}
                        onChange={(e) => setDraftTimezone(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none text-xs font-mono"
                      >
                        <option value="Asia/Kolkata">Asia/Kolkata</option>
                        <option value="UTC">UTC</option>
                        <option value="Asia/Dubai">Asia/Dubai</option>
                      </select>
                    </div>

                    {/* User Category */}
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">User Category</label>
                      <input
                        type="text"
                        value={draftUserCategory}
                        onChange={(e) => setDraftUserCategory(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none text-xs"
                      />
                    </div>

                    {/* Instance (Screenshot 2) */}
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Instance</label>
                      <input
                        type="text"
                        value={draftInstance}
                        onChange={(e) => setDraftInstance(e.target.value)}
                        placeholder="e.g. production-bopal"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none text-xs font-mono"
                      />
                    </div>

                    {/* Acceptance for Terms and/or Policies */}
                    <div className="md:col-span-2 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                        <input
                          type="checkbox"
                          checked={draftAcceptTerms}
                          onChange={(e) => setDraftAcceptTerms(e.target.checked)}
                          className="rounded border-slate-300 text-slate-900 focus:ring-0"
                        />
                        <span>Acceptance for Terms and/or Policies</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Spatial Outlets Assignment */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">Branch Outlets Authorization</h3>
                      <p className="text-[11px] text-slate-500">Defines WHERE this employee can execute transactions</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={draftHasAllBranches}
                        onChange={(e) => {
                          const next = e.target.checked;
                          setDraftHasAllBranches(next);
                          if (next) setDraftBranchIds(branches.map(b => b.id));
                        }}
                        className="rounded border-slate-300 text-slate-900 focus:ring-0"
                      />
                      <span>Access All Branches</span>
                    </label>
                  </div>

                  {!draftHasAllBranches && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {branches.map(b => {
                        const isAssigned = draftBranchIds.includes(b.id);
                        return (
                          <div
                            key={b.id}
                            onClick={() => handleToggleBranch(b.id)}
                            className={`p-2.5 rounded border text-xs cursor-pointer flex items-center justify-between ${
                              isAssigned ? 'border-slate-900 bg-slate-50 font-medium' : 'border-slate-200 bg-white hover:bg-slate-50'
                            }`}
                          >
                            <span>{b.name} ({b.city})</span>
                            {isAssigned ? <Check className="w-3.5 h-3.5 text-slate-900" /> : <div className="w-3.5 h-3.5" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: ROLES & PERMISSIONS (SCREENSHOT 4: Click Role opens Permission Table!) */}
            {/* ========================================================================= */}
            {activeTab === 'roles_permissions' && (
              <div className="space-y-4">

                {/* ROLES SECTION (Clicking any role opens Screenshot 4 Modal) */}
                <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-100">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900">Roles</h2>
                      <p className="text-slate-500 text-[11px]">
                        Select roles for this employee. <span className="text-blue-600 font-medium">Click any role name to inspect document-level permissions.</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() => setDraftRoles(roles.map(r => r.id))}
                        className="text-blue-600 hover:underline font-medium cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setDraftRoles([])}
                        className="text-blue-600 hover:underline font-medium cursor-pointer"
                      >
                        Uncheck All
                      </button>
                      <input
                        type="text"
                        value={roleSearch}
                        onChange={(e) => setRoleSearch(e.target.value)}
                        placeholder="Search roles..."
                        className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none w-32"
                      />
                    </div>
                  </div>

                  {/* 4-Column Checkbox Grid (Matching Screenshot 4) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2 text-xs">
                    {filteredRoles.map(role => {
                      const isChecked = draftRoles.includes(role.id);
                      return (
                        <div
                          key={role.id}
                          className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 group"
                        >
                          <label className="flex items-center gap-2 cursor-pointer select-none truncate">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleRole(role.id)}
                              className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                            />
                            <span
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedRoleForModal(role);
                              }}
                              className={`${isChecked ? 'text-slate-900 font-medium' : 'text-slate-600'} truncate cursor-pointer hover:text-blue-600 hover:underline`}
                            >
                              {role.name}
                            </span>
                          </label>

                          {/* Click to open Screenshot 4 Document Type Permissions Modal! */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedRoleForModal(role);
                            }}
                            title={`Inspect ${role.name} permissions table`}
                            className="text-[10px] text-blue-600 hover:text-blue-800 opacity-60 group-hover:opacity-100 hover:underline px-1 py-0.5 rounded cursor-pointer shrink-0"
                          >
                            inspect
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ALLOW MODULES SECTION (Strict Per-Employee Visibility with Hierarchy) */}
                <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-semibold text-slate-900">Module Access & Action Permissions</h2>
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200 font-mono">
                          {draftAllowedModules.length} Active Modules
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px]">
                        Assign parent/child access and granular action permissions (View, Create, Edit, Delete, etc.)
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          const allChildIds = [];
                          HIERARCHICAL_MODULES.forEach(p => p.children.forEach(c => allChildIds.push(c.id)));
                          setDraftAllowedModules(allChildIds);
                        }}
                        className="text-blue-600 hover:underline font-medium cursor-pointer"
                      >
                        Select All Parent
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to clear all module access?')) {
                            setDraftAllowedModules([]);
                            setDraftActionPermissions({});
                          }
                        }}
                        className="text-rose-600 hover:underline font-medium cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {HIERARCHICAL_MODULES.map(parent => {
                      const childIds = parent.children.map(c => c.id);
                      const activeChildrenCount = childIds.filter(id => draftAllowedModules.includes(id)).length;
                      const allChecked = activeChildrenCount === childIds.length;
                      const someChecked = activeChildrenCount > 0 && activeChildrenCount < childIds.length;

                      return (
                        <div key={parent.id} className="border border-slate-200 rounded-lg overflow-hidden">
                          {/* Parent Header */}
                          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-slate-900 text-sm">
                              <input
                                type="checkbox"
                                checked={allChecked}
                                ref={el => { if (el) el.indeterminate = someChecked; }}
                                onChange={(e) => handleToggleParentModule(parent.id, e.target.checked)}
                                className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                              />
                              {parent.name}
                            </label>
                            <span className="text-[10px] text-slate-500">
                              {activeChildrenCount} / {childIds.length} Child Modules
                            </span>
                          </div>

                          {/* Child Modules List */}
                          <div className="divide-y divide-slate-100 bg-white">
                            {parent.children.map(child => {
                              const isChildChecked = draftAllowedModules.includes(child.id);
                              const actions = child.actions || [];
                              const userActions = draftActionPermissions[child.id] || [];

                              return (
                                <div key={child.id} className="px-4 py-3 hover:bg-slate-50/50 transition-colors">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    {/* Child Module Checkbox */}
                                    <label className="flex items-center gap-2 cursor-pointer select-none min-w-[200px]">
                                      <input
                                        type="checkbox"
                                        checked={isChildChecked}
                                        onChange={(e) => handleToggleModule(child.id, e.target.checked)}
                                        className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                                      />
                                      <span className={`text-xs ${isChildChecked ? 'font-medium text-slate-900' : 'text-slate-600'}`}>
                                        {child.name}
                                      </span>
                                    </label>

                                    {/* Action Permissions Checkboxes (Only show if child is enabled) */}
                                    {isChildChecked && actions.length > 0 && (
                                      <div className="flex flex-wrap gap-x-4 gap-y-2 sm:ml-auto">
                                        {STANDARD_ACTIONS.filter(act => actions.includes(act.key)).map(action => {
                                          const hasAction = userActions.includes(action.key);
                                          return (
                                            <label key={action.key} className="flex items-center gap-1.5 cursor-pointer text-[11px] select-none">
                                              <input
                                                type="checkbox"
                                                checked={hasAction}
                                                onChange={(e) => handleToggleAction(child.id, action.key, e.target.checked)}
                                                className="rounded-sm border-slate-300 text-blue-600 focus:ring-0 cursor-pointer h-3 w-3"
                                              />
                                              <span className={hasAction ? 'text-slate-800' : 'text-slate-400'}>
                                                {action.label}
                                              </span>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 3: MORE INFORMATION (Frappe/ERPNext style) */}
            {activeTab === 'more_info' && (
              <div className="space-y-4">

                {/* Personal & Demographics */}
                <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 space-y-4 shadow-2xs">
                  <h2 className="text-sm font-semibold text-slate-900 pb-2 border-b border-slate-100">Personal Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Gender</label>
                      <select
                        value={draftGender}
                        onChange={e => setDraftGender(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                      >
                        {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map(g => <option key={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Birth Date</label>
                      <input
                        type="date"
                        value={draftBirthDate}
                        onChange={e => setDraftBirthDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-medium mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</label>
                      <input
                        type="tel"
                        value={draftPhone}
                        onChange={e => setDraftPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-medium mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Location</label>
                      <input
                        type="text"
                        value={draftLocation}
                        onChange={e => setDraftLocation(e.target.value)}
                        placeholder="City, State"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-slate-500 font-medium mb-1">Bio</label>
                      <textarea
                        rows={3}
                        value={draftBio}
                        onChange={e => setDraftBio(e.target.value)}
                        placeholder="Short bio about this user..."
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Social Profiles */}
                <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 space-y-4 shadow-2xs">
                  <h2 className="text-sm font-semibold text-slate-900 pb-2 border-b border-slate-100">Social Profiles</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="flex items-center gap-1 text-slate-500 font-medium mb-1">
                        <ExternalLink className="w-3.5 h-3.5 text-blue-700" /> LinkedIn
                      </label>
                      <input
                        type="url"
                        value={draftLinkedIn}
                        onChange={e => setDraftLinkedIn(e.target.value)}
                        placeholder="https://linkedin.com/in/..."
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1 text-slate-500 font-medium mb-1">
                        <ExternalLink className="w-3.5 h-3.5" /> GitHub
                      </label>
                      <input
                        type="url"
                        value={draftGitHub}
                        onChange={e => setDraftGitHub(e.target.value)}
                        placeholder="https://github.com/..."
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1 text-slate-500 font-medium mb-1">
                        <Globe className="w-3.5 h-3.5 text-green-700" /> Medium
                      </label>
                      <input
                        type="url"
                        value={draftMedium}
                        onChange={e => setDraftMedium(e.target.value)}
                        placeholder="https://medium.com/@..."
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none font-mono text-[11px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Education Details */}
                <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-slate-600" />
                      Education Details
                    </h2>
                    <button
                      type="button"
                      onClick={() => setEducationRows(r => [...r, { school: '', qualification: '', year: '', grade: '' }])}
                      className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium"
                    >
                      <Plus className="w-3 h-3" /> Add Row
                    </button>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[11px] text-slate-500 font-semibold uppercase">
                        <th className="py-1 pr-3">School/University</th>
                        <th className="py-1 pr-3">Qualification</th>
                        <th className="py-1 pr-3">Year</th>
                        <th className="py-1 pr-3">Class/Grade</th>
                        <th className="py-1 w-6"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {educationRows.map((row, i) => (
                        <tr key={i}>
                          {['school', 'qualification', 'year', 'grade'].map(field => (
                            <td key={field} className="py-1 pr-2">
                              <input
                                type="text"
                                value={row[field]}
                                onChange={e => {
                                  const updated = [...educationRows];
                                  updated[i] = { ...updated[i], [field]: e.target.value };
                                  setEducationRows(updated);
                                }}
                                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
                              />
                            </td>
                          ))}
                          <td className="py-1">
                            <button
                              type="button"
                              onClick={() => setEducationRows(r => r.filter((_, j) => j !== i))}
                              className="p-1 text-slate-400 hover:text-rose-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {educationRows.length === 0 && (
                    <p className="text-slate-400 italic text-center py-2">No education records. Click &quot;Add Row&quot; to add one.</p>
                  )}
                </div>

                {/* Professional */}
                <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
                  <h2 className="text-sm font-semibold text-slate-900 pb-2 border-b border-slate-100 mb-4">Professional Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Company / Tenant</label>
                      <input type="text" readOnly value="ABC Foods Pvt Ltd" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 cursor-default" />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Employee ID</label>
                      <input type="text" readOnly value={`EMP-${selectedUser?.id?.replace('usr-', '').toUpperCase() || '1001'}`} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-mono cursor-default" />
                    </div>
                    <div>
                      <label className="flex items-center gap-1 text-slate-500 font-medium mb-1"><Calendar className="w-3 h-3" /> Joining Date</label>
                      <input type="text" readOnly value="15 Jan 2025" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 cursor-default" />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Designation</label>
                      <input type="text" readOnly value={draftUserCategory} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 cursor-default" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SETTINGS (Matching User Screenshot Exactly) */}
            {activeTab === 'settings' && (
              <div className="bg-white rounded-xl border border-slate-200/80 p-6 space-y-6 text-xs shadow-2xs">
                {/* 1. Navigation Settings */}
                <div className="space-y-3 pb-5 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => setNavSettingsOpen(!navSettingsOpen)}
                    className="flex items-center gap-1.5 font-semibold text-slate-800 text-xs hover:text-slate-950 cursor-pointer"
                  >
                    <span>Navigation Settings</span>
                    {navSettingsOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                  </button>

                  {navSettingsOpen && (
                    <div className="space-y-2.5 pt-1 pl-0.5">
                      <label className="flex items-center gap-2.5 cursor-pointer text-slate-800 hover:text-slate-950">
                        <input
                          type="checkbox"
                          checked={settingSearchBar}
                          onChange={(e) => setSettingSearchBar(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-slate-900 focus:ring-0 cursor-pointer accent-slate-900"
                        />
                        <span>Search Bar</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer text-slate-800 hover:text-slate-950">
                        <input
                          type="checkbox"
                          checked={settingNotifications}
                          onChange={(e) => setSettingNotifications(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-slate-900 focus:ring-0 cursor-pointer accent-slate-900"
                        />
                        <span>Notifications</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* 2. List Settings */}
                <div className="space-y-3 pb-5 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => setListSettingsOpen(!listSettingsOpen)}
                    className="flex items-center gap-1.5 font-semibold text-slate-800 text-xs hover:text-slate-950 cursor-pointer"
                  >
                    <span>List Settings</span>
                    {listSettingsOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                  </button>

                  {listSettingsOpen && (
                    <div className="space-y-2.5 pt-1 pl-0.5">
                      <label className="flex items-center gap-2.5 cursor-pointer text-slate-800 hover:text-slate-950">
                        <input
                          type="checkbox"
                          checked={settingListSidebar}
                          onChange={(e) => setSettingListSidebar(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-slate-900 focus:ring-0 cursor-pointer accent-slate-900"
                        />
                        <span>Sidebar</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer text-slate-800 hover:text-slate-950">
                        <input
                          type="checkbox"
                          checked={settingBulkActions}
                          onChange={(e) => setSettingBulkActions(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-slate-900 focus:ring-0 cursor-pointer accent-slate-900"
                        />
                        <span>Bulk Actions</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer text-slate-800 hover:text-slate-950">
                        <input
                          type="checkbox"
                          checked={settingViewSwitcher}
                          onChange={(e) => setSettingViewSwitcher(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-slate-900 focus:ring-0 cursor-pointer accent-slate-900"
                        />
                        <span>View Switcher</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* 3. Form Settings */}
                <div className="space-y-3 pb-5 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => setFormSettingsOpen(!formSettingsOpen)}
                    className="flex items-center gap-1.5 font-semibold text-slate-800 text-xs hover:text-slate-950 cursor-pointer"
                  >
                    <span>Form Settings</span>
                    {formSettingsOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                  </button>

                  {formSettingsOpen && (
                    <div className="space-y-2.5 pt-1 pl-0.5">
                      <label className="flex items-center gap-2.5 cursor-pointer text-slate-800 hover:text-slate-950">
                        <input
                          type="checkbox"
                          checked={settingFormSidebar}
                          onChange={(e) => setSettingFormSidebar(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-slate-900 focus:ring-0 cursor-pointer accent-slate-900"
                        />
                        <span>Sidebar</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer text-slate-800 hover:text-slate-950">
                        <input
                          type="checkbox"
                          checked={settingTimeline}
                          onChange={(e) => setSettingTimeline(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-slate-900 focus:ring-0 cursor-pointer accent-slate-900"
                        />
                        <span>Timeline</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer text-slate-800 hover:text-slate-950">
                        <input
                          type="checkbox"
                          checked={settingDashboard}
                          onChange={(e) => setSettingDashboard(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-slate-900 focus:ring-0 cursor-pointer accent-slate-900"
                        />
                        <span>Dashboard</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* 4. Change Password */}
                <div className="space-y-3 pb-5 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => setChangePasswordOpen(!changePasswordOpen)}
                    className="flex items-center gap-1.5 font-semibold text-slate-800 text-xs hover:text-slate-950 cursor-pointer"
                  >
                    <span>Change Password</span>
                    {changePasswordOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                  </button>

                  {changePasswordOpen && (
                    <div className="space-y-3 pt-1 max-w-xl pl-0.5">
                      <div>
                        <label className="block text-slate-600 font-medium mb-1.5 text-xs">Set New Password</label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={settingNewPassword}
                            onChange={(e) => setSettingNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="w-full px-3 py-2 pr-9 bg-slate-100/70 border border-slate-200 rounded text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                            title={showNewPassword ? 'Hide password' : 'Show password'}
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-600" />}
                          </button>
                        </div>
                      </div>

                      <label className="flex items-center gap-2.5 cursor-pointer text-slate-800 hover:text-slate-950 pt-1">
                        <input
                          type="checkbox"
                          checked={settingLogoutAll}
                          onChange={(e) => setSettingLogoutAll(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-slate-900 focus:ring-0 cursor-pointer accent-slate-900"
                        />
                        <span>Logout From All Devices After Changing Password</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* 5. Document Follow */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setDocFollowOpen(!docFollowOpen)}
                    className="flex items-center gap-1.5 font-semibold text-slate-800 text-xs hover:text-slate-950 cursor-pointer"
                  >
                    <span>Document Follow</span>
                    {docFollowOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                  </button>

                  {docFollowOpen && (
                    <div className="space-y-2.5 pt-1 pl-0.5">
                      <label className="flex items-center gap-2.5 cursor-pointer text-slate-800 hover:text-slate-950">
                        <input
                          type="checkbox"
                          checked={settingDocEmail}
                          onChange={(e) => setSettingDocEmail(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-slate-900 focus:ring-0 cursor-pointer accent-slate-900"
                        />
                        <span>Send Email Notifications for Followed Documents</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer text-slate-800 hover:text-slate-950">
                        <input
                          type="checkbox"
                          checked={settingDailyDigest}
                          onChange={(e) => setSettingDailyDigest(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-slate-900 focus:ring-0 cursor-pointer accent-slate-900"
                        />
                        <span>Daily Digest of Activity</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: CONNECTIONS */}
            {activeTab === 'connections' && (
              <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
                <h2 className="text-sm font-semibold text-slate-900 pb-2 border-b border-slate-100">Connected Transactions & Logs</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                    <p className="text-base font-bold text-slate-900">142</p>
                    <p className="text-slate-500 mt-0.5">Orders Processed</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                    <p className="text-base font-bold text-slate-900">₹94,250</p>
                    <p className="text-slate-500 mt-0.5">Total Settled</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                    <p className="text-base font-bold text-slate-900">{draftBranchIds.length}</p>
                    <p className="text-slate-500 mt-0.5">Active Outlets</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                    <p className="text-base font-bold text-slate-900">8</p>
                    <p className="text-slate-500 mt-0.5">Audit Events</p>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* SCREENSHOT 4: ROLE DOCUMENT-LEVEL PERMISSIONS MATRIX MODAL */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* SCREENSHOT 4: ROLE DOCUMENT-LEVEL PERMISSIONS MATRIX MODAL */}
      {/* ========================================================================= */}
      {selectedRoleForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            
            {/* Modal Header (Matching Screenshot 4: Role Name + ✕) */}
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
              <h3 className="font-semibold text-sm text-slate-900">
                {selectedRoleForModal.name}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedRoleForModal(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Table Container with Horizontal Scroll (Screenshot 4 Table) */}
            <div className="p-5 overflow-auto flex-1 text-xs">
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-700">
                      <th className="p-2 border-r border-slate-200 whitespace-nowrap">Document Type</th>
                      <th className="p-2 border-r border-slate-200 text-center whitespace-nowrap">Level</th>
                      <th className="p-2 border-r border-slate-200 text-center whitespace-nowrap">If Owner</th>
                      <th className="p-2 border-r border-slate-200 text-center whitespace-nowrap">Select</th>
                      <th className="p-2 border-r border-slate-200 text-center whitespace-nowrap">Read</th>
                      <th className="p-2 border-r border-slate-200 text-center whitespace-nowrap">Write</th>
                      <th className="p-2 border-r border-slate-200 text-center whitespace-nowrap">Create</th>
                      <th className="p-2 border-r border-slate-200 text-center whitespace-nowrap">Delete</th>
                      <th className="p-2 border-r border-slate-200 text-center whitespace-nowrap">Submit</th>
                      <th className="p-2 border-r border-slate-200 text-center whitespace-nowrap">Cancel</th>
                      <th className="p-2 border-r border-slate-200 text-center whitespace-nowrap">Amend</th>
                      <th className="p-2 border-r border-slate-200 text-center whitespace-nowrap">Report</th>
                      <th className="p-2 border-r border-slate-200 text-center whitespace-nowrap">Import</th>
                      <th className="p-2 border-r border-slate-200 text-center whitespace-nowrap">Export</th>
                      <th className="p-2 border-r border-slate-200 text-center whitespace-nowrap">Print</th>
                      <th className="p-2 border-r border-slate-200 text-center whitespace-nowrap">Email</th>
                      <th className="p-2 text-center whitespace-nowrap">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {roleDocPermissions.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="p-2 font-medium text-slate-900 border-r border-slate-200 whitespace-nowrap">
                          {row.doctype}
                        </td>
                        <td className="p-2 text-center text-slate-600 border-r border-slate-200 font-mono">
                          {row.level}
                        </td>
                        <td className="p-2 text-center text-slate-400 border-r border-slate-200">
                          {row.ifOwner || '-'}
                        </td>
                        <td className="p-2 text-center border-r border-slate-200">
                          {row.select ? <Check className="w-3.5 h-3.5 text-slate-800 mx-auto" /> : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="p-2 text-center border-r border-slate-200">
                          {row.read ? <Check className="w-3.5 h-3.5 text-slate-800 mx-auto" /> : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="p-2 text-center border-r border-slate-200">
                          {row.write ? <Check className="w-3.5 h-3.5 text-slate-800 mx-auto" /> : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="p-2 text-center border-r border-slate-200">
                          {row.create ? <Check className="w-3.5 h-3.5 text-slate-800 mx-auto" /> : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="p-2 text-center border-r border-slate-200">
                          {row.delete ? <Check className="w-3.5 h-3.5 text-slate-800 mx-auto" /> : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="p-2 text-center border-r border-slate-200">
                          {row.submit ? <Check className="w-3.5 h-3.5 text-slate-800 mx-auto" /> : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="p-2 text-center border-r border-slate-200">
                          {row.cancel ? <Check className="w-3.5 h-3.5 text-slate-800 mx-auto" /> : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="p-2 text-center border-r border-slate-200">
                          {row.amend ? <Check className="w-3.5 h-3.5 text-slate-800 mx-auto" /> : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="p-2 text-center border-r border-slate-200">
                          {row.report ? <Check className="w-3.5 h-3.5 text-slate-800 mx-auto" /> : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="p-2 text-center border-r border-slate-200">
                          {row.import ? <Check className="w-3.5 h-3.5 text-slate-800 mx-auto" /> : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="p-2 text-center border-r border-slate-200">
                          {row.export ? <Check className="w-3.5 h-3.5 text-slate-800 mx-auto" /> : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="p-2 text-center border-r border-slate-200">
                          {row.print ? <Check className="w-3.5 h-3.5 text-slate-800 mx-auto" /> : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="p-2 text-center border-r border-slate-200">
                          {row.email ? <Check className="w-3.5 h-3.5 text-slate-800 mx-auto" /> : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="p-2 text-center">
                          {row.share ? <Check className="w-3.5 h-3.5 text-slate-800 mx-auto" /> : <span className="text-slate-300">-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedRoleForModal(null)}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 w-full max-w-sm p-5 text-xs space-y-3.5 shadow-2xl">
            <h3 className="font-semibold text-sm text-slate-900">Set User Password</h3>
            <p className="text-slate-500">Update password for <span className="font-mono text-slate-800">{draftEmail}</span>:</p>
            <input
              type="password"
              defaultValue="password123"
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs focus:bg-white focus:outline-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPasswordModalOpen(false)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setPasswordModalOpen(false);
                  showToast('Password updated', 'success');
                }}
                className="px-3.5 py-1.5 bg-slate-900 text-white rounded-lg font-medium"
              >
                Save Password
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
