import { useState } from "react";
import { Settings, Wallet, CreditCard, Bell, Shield, Database, Globe, Key } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  const settingsTabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "wallet", label: "Wallet", icon: Wallet },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "integrations", label: "Integrations", icon: Database }
  ];

  const mockSettings = {
    general: {
      companyName: "VPay Solutions",
      defaultCurrency: "USD",
      timezone: "UTC",
      language: "English"
    },
    wallet: {
      connectedWallet: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
      network: "Polygon Mainnet",
      autoConnect: true
    },
    payments: {
      defaultToken: "USDC",
      gasLimit: "500,000",
      gasPrice: "Auto",
      confirmations: 12
    },
    notifications: {
      emailNotifications: true,
      paymentAlerts: true,
      overdueReminders: true,
      recurringGeneration: true
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: "24 hours",
      ipWhitelist: false
    },
    integrations: {
      polygonScan: true,
      ipfsGateway: "https://ipfs.io",
      emailService: "SendGrid"
    }
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Company Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Company Name</label>
            <input
              type="text"
              defaultValue={mockSettings.general.companyName}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Default Currency</label>
            <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent">
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderWalletSettings = () => (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Wallet Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Connected Wallet</label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                defaultValue={mockSettings.wallet.connectedWallet}
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                readOnly
              />
              <button className="px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-all duration-200">
                Change
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Network</label>
              <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent">
                <option value="polygon">Polygon Mainnet</option>
                <option value="ethereum">Ethereum Mainnet</option>
                <option value="mumbai">Polygon Mumbai (Testnet)</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoConnect"
                defaultChecked={mockSettings.wallet.autoConnect}
                className="w-4 h-4 text-blue-500 bg-white/5 border-white/10 rounded focus:ring-blue-500/50 focus:ring-2"
              />
              <label htmlFor="autoConnect" className="text-sm text-gray-300">Auto-connect wallet</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPaymentSettings = () => (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Payment Preferences</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Default Payment Token</label>
            <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent">
              <option value="USDC">💙 USDC</option>
              <option value="USDT">💚 USDT</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Gas Limit</label>
            <input
              type="text"
              defaultValue={mockSettings.payments.gasLimit}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Gas Price</label>
            <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent">
              <option value="auto">Auto (Recommended)</option>
              <option value="slow">Slow</option>
              <option value="fast">Fast</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Confirmations</label>
            <input
              type="number"
              defaultValue={mockSettings.payments.confirmations}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          {Object.entries(mockSettings.notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-white capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <p className="text-xs text-gray-400">
                  {key === 'emailNotifications' && 'Receive email notifications for important events'}
                  {key === 'paymentAlerts' && 'Get notified when payments are received'}
                  {key === 'overdueReminders' && 'Receive reminders for overdue invoices'}
                  {key === 'recurringGeneration' && 'Notifications when recurring invoices are generated'}
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked={value}
                className="w-5 h-5 text-blue-500 bg-white/5 border-white/10 rounded focus:ring-blue-500/50 focus:ring-2"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Security Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-white">Two-Factor Authentication</label>
              <p className="text-xs text-gray-400">Add an extra layer of security to your account</p>
            </div>
            <button className="px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-all duration-200">
              Enable
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Session Timeout</label>
            <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent">
              <option value="1">1 hour</option>
              <option value="24">24 hours</option>
              <option value="168">1 week</option>
              <option value="never">Never</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderIntegrationSettings = () => (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">External Integrations</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-white">PolygonScan Integration</label>
              <p className="text-xs text-gray-400">View transactions on PolygonScan</p>
            </div>
            <input
              type="checkbox"
              defaultChecked={mockSettings.integrations.polygonScan}
              className="w-5 h-5 text-blue-500 bg-white/5 border-white/10 rounded focus:ring-blue-500/50 focus:ring-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">IPFS Gateway</label>
            <input
              type="text"
              defaultValue={mockSettings.integrations.ipfsGateway}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return renderGeneralSettings();
      case "wallet":
        return renderWalletSettings();
      case "payments":
        return renderPaymentSettings();
      case "notifications":
        return renderNotificationSettings();
      case "security":
        return renderSecuritySettings();
      case "integrations":
        return renderIntegrationSettings();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 mt-1">Configure your invoice and payment preferences</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg shadow-blue-500/25">
          <Key className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      {/* Settings Tabs */}
      <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
        {settingsTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Backend Integration Info */}
      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-3">System Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400 mb-2">Backend Features:</p>
            <ul className="text-white space-y-1">
              <li>• Invoice management system</li>
              <li>• Crypto payment processing</li>
              <li>• Recurring invoice automation</li>
              <li>• Email notification system</li>
            </ul>
          </div>
          <div>
            <p className="text-gray-400 mb-2">Smart Contract:</p>
            <ul className="text-white space-y-1">
              <li>• Polygon network integration</li>
              <li>• USDC/USDT support</li>
              <li>• NFT receipt generation</li>
              <li>• Gas optimization</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
